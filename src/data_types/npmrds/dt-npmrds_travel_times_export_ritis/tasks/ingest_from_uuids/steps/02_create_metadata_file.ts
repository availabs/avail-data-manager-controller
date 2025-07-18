import { readdirSync, createReadStream, writeFileSync } from "fs";
import { join } from "path";
import unzipper from "unzipper";

import dama_events from "data_manager/events";
import logger from "data_manager/logger";
import { verifyIsInTaskEtlContext } from "data_manager/contexts";
import getEltWorkDir from "var/getEtlWorkDir";
import { NpmrdsDownloadName } from "data_types/npmrds/domain";

export enum EventTypes {
  CREATE_METADATA_DONE = ":CREATE_METADATA_DONE",
}

// A simplified representation for our metadata file
interface IMetadata {
  metadata: {
    name: NpmrdsDownloadName;
    state: string;
    year: number;
    start_date: string;
    end_date: string;
    is_expanded: boolean;
    is_complete_month: boolean;
    is_complete_week: boolean;
  };

  downloads: { uuid: string; dataSource: string }[];
}

// Regular expression to parse the NpmrdsDownloadName
const NPMRDS_NAME_RE =
  /^(npmrdsx?)_([a-z]{2})_from_(\d{8})_to_(\d{8})_v(\d{8}T?\d{4,6})$/;

async function processZipFile(
  zipFilePath: string,
  onFile: (fileName: string, fileStream: NodeJS.ReadableStream) => Promise<void>
): Promise<void> {
  return new Promise((resolve, reject) => {
    createReadStream(zipFilePath)
      .pipe(unzipper.Parse())
      .on("entry", async (entry) => {
        try {
          await onFile(entry.path, entry);
          entry.autodrain(); // Ensure unused streams are drained
        } catch (err) {
          reject(err);
        }
      })
      .on("close", resolve)
      .on("error", reject);
  });
}

function getDataSourceFromContents(contents: string): string {
  if (contents.includes("(Trucks and passenger vehicles)")) {
    return "all_vehicles";
  }
  if (contents.includes("(Passenger vehicles)")) {
    return "passenger_vehicles";
  }
  if (contents.includes("(Trucks)")) {
    return "trucks";
  }
  throw new Error("Unable to determine data source from Contents.txt");
}

export async function _processFile(
  etl_work_dir: string,
  file: string
): Promise<{
  npmrdsDownloadName: string;
  metadataEntry: IMetadata["metadata"];
  uuid: string;
  dataSource: string;
}> {
  const uuid = file.replace(".zip", "");
  const zipFilePath = join(etl_work_dir, file);

  let contentsTxt = "";
  let dataCsvFileName = "";

  await processZipFile(zipFilePath, async (fileName, fileStream) => {
    if (fileName.endsWith("Contents.txt")) {
      const chunks: Buffer[] = [];

      for await (const chunk of fileStream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      contentsTxt = Buffer.concat(chunks).toString("utf-8");
    } else if (fileName.match(/^npmrds.*\.csv$/)) {
      dataCsvFileName = fileName;
    }
  });

  if (!contentsTxt || !dataCsvFileName) {
    throw new Error(`Archive ${file} is missing required files.`);
  }

  const dataSource = getDataSourceFromContents(contentsTxt);
  const npmrdsDownloadName = dataCsvFileName.replace(".csv", "");

  const [, is_expanded_str, state, start_date_str, end_date_str] =
    npmrdsDownloadName.match(NPMRDS_NAME_RE) || [];

  console.log("==>", npmrdsDownloadName);
  console.log([, is_expanded_str, state, start_date_str, end_date_str]);

  const start_date = `${start_date_str.slice(0, 4)}-${start_date_str.slice(
    4,
    6
  )}-${start_date_str.slice(6, 8)}`;
  const end_date = `${end_date_str.slice(0, 4)}-${end_date_str.slice(
    4,
    6
  )}-${end_date_str.slice(6, 8)}`;

  const download = { uuid, dataSource };

  const metadataEntry = {
    name: npmrdsDownloadName,
    state,
    year: parseInt(start_date_str.slice(0, 4), 10),
    start_date,
    end_date,
    is_expanded: is_expanded_str === "npmrdsx",
    is_complete_month: false,
    is_complete_week: false,
  };

  return { npmrdsDownloadName, metadataEntry, uuid, dataSource };
}

export default async function main() {
  verifyIsInTaskEtlContext();

  const events = await dama_events.getAllEtlContextEvents();

  if (events.some(({ type }) => type === EventTypes.CREATE_METADATA_DONE)) {
    logger.info("Metadata file already created. Skipping step.");
    return;
  }

  logger.info("BEGIN step 2: create metadata file");

  const etl_work_dir = getEltWorkDir();
  const files = readdirSync(etl_work_dir).filter((f) => f.endsWith(".zip"));

  let the_download_name: string | null = null;

  const download_metadata: IMetadata = {
    downloads: [],
  };

  for (const file of files) {
    const { npmrdsDownloadName, metadataEntry, uuid, dataSource } =
      await _processFile(etl_work_dir, file);

    if (the_download_name === null) {
      the_download_name = npmrdsDownloadName;
    } else if (the_download_name !== npmrdsDownloadName) {
      throw new Error(
        `There must be a single NPMRDS download name. Saw "${the_download_name}" and "${npmrdsDownloadName}"`
      );
    }

    if (!download_metadata.metadata) {
      download_metadata.metadata = metadataEntry;
    }

    download_metadata.downloads.push({ uuid, dataSource });
  }

  const metadataFilePath = join(etl_work_dir, "metadata.json");

  writeFileSync(metadataFilePath, JSON.stringify(download_metadata, null, 4));

  await dama_events.dispatch({ type: EventTypes.CREATE_METADATA_DONE });

  logger.info("END step 2: create metadata file");
}
