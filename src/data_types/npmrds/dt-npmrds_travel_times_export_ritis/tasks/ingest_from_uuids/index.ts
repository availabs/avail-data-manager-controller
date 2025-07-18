import dama_events from "data_manager/events";
import logger from "data_manager/logger";
import { verifyIsInTaskEtlContext } from "data_manager/contexts";

import step1_download_archives from "./steps/01_download_archives";
import step2_create_metadata_file from "./steps/02_create_metadata_file";
import step3_organize_archives from "./steps/03_organize_archives";

import { RitisDownloadRequestUuid, IngestInitialEvent } from "../../domain/";

export enum EventTypes {
  INGEST_START = ":INGEST_START",
  INGEST_DONE = ":INGEST_DONE",
  FINAL = ":FINAL",
}

export type FinalEvent = {
  type: EventTypes.FINAL;
};

export default async function main() {
  verifyIsInTaskEtlContext();

  const events = await dama_events.getAllEtlContextEvents();

  if (events.some(({ type }) => type === EventTypes.FINAL)) {
    logger.info("Ingestion already complete. Exiting.");
    return;
  }

  // Always dispatch :INGEST_START to handle retries from an :ERROR state.
  await dama_events.dispatch({ type: EventTypes.INGEST_START });

  logger.info("BEGIN Ingest from UUIDs Task");

  const {
    payload: { ritis_uuids },
  }: IngestInitialEvent = events[0];

  await step1_download_archives(ritis_uuids);
  await step2_create_metadata_file();
  await step3_organize_archives();

  const done_event: FinalEvent = { type: EventTypes.FINAL };

  await dama_events.dispatch(done_event);

  logger.info("END Ingest from UUIDs Task");
}
