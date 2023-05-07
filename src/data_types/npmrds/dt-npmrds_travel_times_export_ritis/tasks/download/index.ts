import dama_events from "data_manager/events";
import logger from "data_manager/logger";
import { verifyIsInTaskEtlContext } from "data_manager/contexts";

import request_npmrds_export from "./steps/request_npmrds_export";
import get_download_urls from "./steps/get_download_urls";
import download_npmrds_export from "./steps/download_npmrds_export";

import { NpmrdsExportRequest } from "data_types/npmrds/domain";

import { NpmrdsExportDownloadMeta } from "../../domain";

export type InitialEvent = {
  type: ":INITIAL";
  payload: NpmrdsExportRequest;
};

export type FinalEvent = {
  type: ":FINAL";
  payload: NpmrdsExportDownloadMeta;
};

export default async function main(
  initial_event: InitialEvent
): Promise<FinalEvent["payload"]> {
  verifyIsInTaskEtlContext();

  const events = await dama_events.getAllEtlContextEvents();

  let final_event: FinalEvent | undefined = events.find(
    ({ type }) => type === ":FINAL"
  );

  if (final_event) {
    return final_event.payload;
  }

  try {
    const {
      payload: { state, start_date, end_date, is_expanded },
    } = initial_event;

    logger.debug(
      `dt-npmrds_travel_times_export_ritis download task ${JSON.stringify(
        { state, start_date, end_date, is_expanded },
        null,
        4
      )}`
    );

    await request_npmrds_export(state, start_date, end_date, is_expanded);

    await get_download_urls();

    const done_data = await download_npmrds_export();

    final_event = {
      type: ":FINAL",
      payload: done_data,
    };

    await dama_events.dispatch(final_event);

    return done_data;
  } catch (err) {
    const { message, stack } = <Error>err;

    logger.error(message);
    logger.error(stack);

    await dama_events.dispatch({
      type: ":ERROR",
      payload: { message, stack },
      error: true,
    });

    throw err;
  }
}