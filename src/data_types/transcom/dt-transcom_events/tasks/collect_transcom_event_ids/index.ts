import { inspect } from "util";

import fetch from "node-fetch";
import { Database as SQLiteDB } from "better-sqlite3";
import _ from "lodash";

import dama_events from "data_manager/events";
import logger from "data_manager/logger";

import { verifyIsInTaskEtlContext } from "data_manager/contexts";

import { sleep } from "data_utils/time";

import {
  getTranscomRequestFormattedTimestamp,
  validateTranscomRequestTimestamp,
  partitionTranscomRequestTimestampsByMonth,
  TranscomApiRequestTimestamp,
} from "../../utils/dates";

import TranscomAuthTokenCollector from "../../utils/TranscomAuthTokenCollector";

import getEtlContextLocalStateSqliteDb from "../../utils/getEtlContextLocalStateSqliteDb";

import { RawTranscomEvent } from "../../domain";

const DEFAULT_SLEEP_MS = 10 * 1000; // 10 seconds

export type InitialEvent = {
  type: ":INITIAL";
  payload: {
    etl_work_dir: string;
    start_timestamp: string;
    end_timestamp: string;
  };
  meta: { subtask_name: "collect_transcom_event_ids" };
};

export type FinalEvent = {
  type: ":FINAL";
};

export const url =
  "https://eventsearch.xcmdata.org/HistoricalEventSearch/xcmEvent/getEventGridData";

export async function* makeRawTranscomEventIterator(
  transcom_start_timestamp: string,
  transcom_end_timestamp: string,
  sleepMs: number = DEFAULT_SLEEP_MS
): AsyncGenerator<RawTranscomEvent> {
  validateTranscomRequestTimestamp(transcom_start_timestamp);
  validateTranscomRequestTimestamp(transcom_end_timestamp);

  const partitionedDateTimes = partitionTranscomRequestTimestampsByMonth(
    transcom_start_timestamp,
    transcom_end_timestamp
  );

  const tokenCollector = new TranscomAuthTokenCollector();

  let must_sleep = false;

  for (const [partitionStartTime, partitionEndTime] of partitionedDateTimes) {
    if (must_sleep) {
      await new Promise((resolve) => setTimeout(resolve, sleepMs));
    }

    const reqBody = {
      // See  ../documentation/EventCategoryIds.md
      eventCategoryIds: "1,2,3,4,13",
      eventStatus: "",
      eventType: "",
      state: "",
      county: "",
      city: "",
      reportingOrg: "",
      facility: "",
      primaryLoc: "",
      secondaryLoc: "",
      eventDuration: null,
      startDateTime: partitionStartTime,
      endDateTime: partitionEndTime,
      orgID: "15",
      direction: "",
      iseventbyweekday: 1,
      tripIds: "",
    };

    logger.silly(`reqBody=${JSON.stringify(reqBody, null, 4)}`);

    let authenticationtoken = await tokenCollector.getJWT();

    const cookies = await tokenCollector.getCookies();

    const required_historical_event_cookies = [
      'JSESSIONID',
      'XSRF-Cookie',
      'Anti-Forgery-Cookie'
    ]

    while (
      ! required_historical_event_cookies.every(name => tokenCollector.historicalEventSearchCookies?.[name])
    ) {
      await sleep(1000)
    }

    const jsessionid_cookie = tokenCollector.historicalEventSearchCookies['JSESSIONID']
    const xsrf_cookie = tokenCollector.historicalEventSearchCookies['XSRF-Cookie']
    const anti_forgery_cookie = tokenCollector.historicalEventSearchCookies['Anti-Forgery-Cookie']

    const names = [
        '_ga',
        'sso_displayName',
        'sso_orgName',
        'sso_token',
        'sso_orgLogo',
        'sso_orgSiteUrl',
        'sso_rightorgLogo',
        'sso_rightorgSiteUrl',
        'sso_FooterData',
        '_ga_6YYDNHMN43',
        'sso_jwtToken',
        '_ga_H5QEG6G104',
    ]

    const cookies_str = [
      `JSESSIONID=${jsessionid_cookie}`,
      `${names.map(n => `${n}=${cookies[n]}`).join('; ')}`,
      `XSRF-Cookie=${xsrf_cookie}`,
      `Anti-Forgery-Cookie=${anti_forgery_cookie}`
    ].join('; ');

    // FIXME: Need to refresh JWT because, in current implementation, TranscomAuthTokenCollector.getJWT creates the page.
    //        Then we need to wait for navigation to HistoricalEventSearch and collection of necessary cookies.
    //        By the time that's done, JWT may be stale.
    authenticationtoken = await tokenCollector.getJWT();

    const headers = {
      "accept": "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9",
      "authenticationtoken": `Bearer ${authenticationtoken}`,
      "content-type": "application/json",
      "priority": "u=1, i",
      "sec-ch-ua": "\"Google Chrome\";v=\"129\", \"Not=A?Brand\";v=\"8\", \"Chromium\";v=\"129\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Linux\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-xsrf-token": xsrf_cookie,
      "cookie": `${cookies_str};`,
      "Referer": "https://eventsearch.xcmdata.org/HistoricalEventSearch/?appId=88",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    }

    const options = {
      method: "POST",
      headers: headers,
      mode: "cors",
      credentials: "include",
      body: JSON.stringify(reqBody),
    };

    const res = await fetch(
      `https://eventsearch.xcmdata.org/HistoricalEventSearch/xcmEvent/getEventGridData?m=${Math.random()}`,
      options
    )

    const res_text = await res.text()

    must_sleep = true;

    try {
      const { data: events } = JSON.parse(res_text)

      logger.debug(`makeRawTranscomEventIterator got ${events?.length} events`);

      if (Array.isArray(events)) {
        for (const event of events) {
          yield event;
        }
      }

    } catch(err) {
      logger.error(res_text);
      logger.error(inspect(response, { depth: null }));
      throw err
    }
  }

  await tokenCollector.close();
}

export async function collectTranscomEventsIdsForDateRangeIntoSqliteDb(
  start_ts: TranscomApiRequestTimestamp,
  end_ts: TranscomApiRequestTimestamp,
  sqlite_db: SQLiteDB
) {
  logger.silly(`downloading events from ${start_ts} to ${end_ts}`);

  try {
    sqlite_db.exec("BEGIN ;");

    const insert_stmt = sqlite_db.prepare(`
      INSERT INTO seen_event ( event_id )
        VALUES ( ? )
        ON CONFLICT ( event_id ) DO NOTHING
      ;
    `);

    const iter = makeRawTranscomEventIterator(start_ts, end_ts);

    let count = 0;

    for await (const { id } of iter) {
      ++count;

      insert_stmt.run(id);

      if (count % 100 === 0) {
        logger.silly(
          `downloaded events ${
            count - 99
          }-${count} for ${start_ts} to ${end_ts}`
        );
      }
    }

    logger.info(
      `${count} events downloaded for ${start_ts} to ${end_ts} and IDs added to sqlite_db`
    );

    sqlite_db.exec("COMMIT ;");
  } catch (err) {
    sqlite_db.exec("ROLLBACK ;");

    logger.error(`===== ERROR downloading for ${start_ts} to ${end_ts} =====`);

    throw err;
  }
}

export function getMonthPartitionsForTimeRange(
  start_timestamp: string | Date,
  end_timestamp: string | Date
) {
  const transcom_start_timestamp: TranscomApiRequestTimestamp =
    getTranscomRequestFormattedTimestamp(start_timestamp);

  const transcom_end_timestamp: TranscomApiRequestTimestamp =
    getTranscomRequestFormattedTimestamp(end_timestamp);

  const month_partitions = partitionTranscomRequestTimestampsByMonth(
    transcom_start_timestamp,
    transcom_end_timestamp
  );

  return month_partitions;
}

export default async function collectTranscomEventIdsForTimeRange(
  etl_work_dir: string, // facilitates testing
  start_timestamp: string | Date,
  end_timestamp: string | Date
): Promise<FinalEvent> {
  verifyIsInTaskEtlContext();

  try {
    const events = await dama_events.getAllEtlContextEvents();

    let final_event = events.find((e) => e.type === ":FINAL");

    if (final_event) {
      logger.info("Task already DONE");
      return final_event;
    }

    const month_partitions = getMonthPartitionsForTimeRange(
      start_timestamp,
      end_timestamp
    );

    logger.info(
      `downloading TRANCOM events for ${start_timestamp} to ${end_timestamp}`
    );

    logger.silly(
      `starting download of month_partitions ${JSON.stringify(
        month_partitions,
        null,
        4
      )}`
    );

    const sqlite_db = getEtlContextLocalStateSqliteDb(etl_work_dir);

    for (const [start_ts, end_ts] of month_partitions) {
      const download_done_event = {
        type: ":TRANSCOM_EVENTS_DOWNLOADED",
        payload: {
          start_ts,
          end_ts,
        },
      };

      if (events.some((e) => _.isEqual(e, download_done_event))) {
        logger.debug(
          `IDEMPOTENCY: TRANSCOM events already downloaded for ${start_ts} to ${end_ts}`
        );

        continue;
      }

      await collectTranscomEventsIdsForDateRangeIntoSqliteDb(
        start_ts,
        end_ts,
        sqlite_db
      );

      await dama_events.dispatch(download_done_event);
    }

    final_event = {
      type: ":FINAL",
    };

    sqlite_db.exec("VACUUM ;");

    await dama_events.dispatch(final_event);

    logger.info(`final_event ${JSON.stringify(final_event, null, 4)}`);

    return final_event;
  } catch (err) {
    logger.error((<Error>err).message);
    logger.error((<Error>err).stack);

    await dama_events.dispatch({
      type: ":ERROR",
      payload: {
        message: (<Error>err).message,
        stack: (<Error>err).stack,
      },
      error: true,
    });

    throw err;
  }
}
