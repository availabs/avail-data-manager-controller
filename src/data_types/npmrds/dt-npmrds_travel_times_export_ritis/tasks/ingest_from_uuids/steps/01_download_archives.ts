import { createWriteStream } from "fs";
import { pipeline } from "stream";
import { join } from "path";
import { promisify } from "util";

import fetch from "node-fetch";

import dama_events from "data_manager/events";
import { sleep } from "data_utils/time";
import logger from "data_manager/logger";
import { verifyIsInTaskEtlContext } from "data_manager/contexts";
import getEtlWorkDir from "var/getEtlWorkDir";

import { RitisDownloadRequestUuid } from "../../../domain";

const pipelineAsync = promisify(pipeline);

export enum EventTypes {
  UUID_DOWNLOADED = ":UUID_DOWNLOADED",
  DOWNLOAD_EXTRACTS_DONE = ":DOWNLOAD_EXTRACTS_DONE",
}

export async function _downloadFile(
  etl_work_dir: string,
  uuid: RitisDownloadRequestUuid,
  maxRetries = 5
) {
  const download_url = `https://npmrds.ritis.org/export/download/${uuid}?dl=1`;
  const fpath = join(etl_work_dir, `${uuid}.zip`);

  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const res = await fetch(download_url);

      if (!res.ok) {
        throw new Error(`Download failed: ${res.statusText}`);
      }

      const ws = createWriteStream(fpath);

      await pipelineAsync(res.body, ws);

      // If successful, exit the retry loop
      return;
    } catch (error) {
      attempt++;
      logger.warn(
        `Attempt ${attempt} to download ${uuid} failed: ${error.message}`
      );

      if (attempt >= maxRetries) {
        throw new Error(
          `Failed to download file after ${maxRetries} attempts: ${error.message}`
        );
      }

      // Exponential backoff with jitter
      const backoffTime = Math.pow(2, attempt) * 100 + Math.random() * 100;
      await sleep(backoffTime / 1000); // Convert milliseconds to seconds
    }
  }
}

export default async function main(uuids: RitisDownloadRequestUuid[]) {
  verifyIsInTaskEtlContext();

  const events = await dama_events.getAllEtlContextEvents();

  if (events.some(({ type }) => type === EventTypes.DOWNLOAD_EXTRACTS_DONE)) {
    logger.info("Archives already downloaded. Skipping step.");
    return;
  }

  logger.info("BEGIN step 1: download archives");

  const etl_work_dir = getEtlWorkDir();

  const downloaded_uuids = new Set(
    events
      .filter(({ type }) => type === EventTypes.UUID_DOWNLOADED)
      .map((event) => event.payload.uuid)
  );

  let must_sleep = false;
  for (const uuid of uuids) {
    if (must_sleep) {
      await sleep(3);
    }

    if (downloaded_uuids.has(uuid)) {
      logger.info(`UUID ${uuid} already downloaded. Skipping.`);
      continue;
    }

    logger.info(`Downloading archive for UUID: ${uuid}`);

    await _downloadFile(etl_work_dir, uuid);
    must_sleep = true;

    await dama_events.dispatch({
      type: EventTypes.UUID_DOWNLOADED,
      payload: { uuid },
    });
  }

  await dama_events.dispatch({ type: EventTypes.DOWNLOAD_EXTRACTS_DONE });

  logger.info("END step 1: download archives");
}
