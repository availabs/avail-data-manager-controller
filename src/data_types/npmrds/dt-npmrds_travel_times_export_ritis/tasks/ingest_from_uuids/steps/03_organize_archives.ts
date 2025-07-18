import { readFileSync, renameSync, mkdirSync } from "fs";
import { join } from "path";

import dama_events from "data_manager/events";
import logger from "data_manager/logger";
import { verifyIsInTaskEtlContext } from "data_manager/contexts";
import getEltWorkDir from "var/getEtlWorkDir";
import getNpmrdsExportsDir from "../../../utils/getNpmrdsExportsDir";
import { setNpmrdsExportMetadataAsync } from "data_types/npmrds/utils/npmrds_export_metadata";

export default async function main() {
  verifyIsInTaskEtlContext();

  const events = await dama_events.getAllEtlContextEvents();
  if (events.some(({ type }) => type === ":ARCHIVES_ORGANIZED")) {
    logger.info("Archives already organized. Skipping step.");
    return;
  }

  logger.info("BEGIN step 3: organize archives");

  const etl_work_dir = getEltWorkDir();
  const npmrds_exports_dir = getNpmrdsExportsDir();
  const metadataFilePath = join(etl_work_dir, "metadata.json");
  const { downloads, metadata: export_metadata } = JSON.parse(
    readFileSync(metadataFilePath, "utf8")
  );

  const npmrdsDownloadName = export_metadata.name;

  for (const download of downloads) {
    const { uuid, dataSource } = download;

    const source_path = join(etl_work_dir, `${uuid}.zip`);
    const dest_dir = join(npmrds_exports_dir, dataSource);
    const dest_path = join(dest_dir, `${npmrdsDownloadName}.zip`);

    mkdirSync(dest_dir, { recursive: true });
    renameSync(source_path, dest_path);

    await setNpmrdsExportMetadataAsync(export_metadata);
  }

  await dama_events.dispatch({ type: ":ARCHIVES_ORGANIZED" });
  logger.info("END step 3: organize archives");
}
