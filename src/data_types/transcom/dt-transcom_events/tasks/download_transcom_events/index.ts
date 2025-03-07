import { createWriteStream, rmSync } from "fs";
import { createGzip, Gzip } from "zlib";

import fetch from "node-fetch";
import _ from "lodash";

import dama_events from "data_manager/events";
import logger from "data_manager/logger";
import { verifyIsInTaskEtlContext } from "data_manager/contexts";

import { getTimestamp } from "data_utils/time";

import TranscomAuthTokenCollector from "../../utils/TranscomAuthTokenCollector";
import getEtlContextLocalStateSqliteDb from "../../utils/getEtlContextLocalStateSqliteDb";
import { getRawTranscomEventsFilePath } from "../../utils/etlWorkDir";

import { RawTranscomEventExpanded } from "../../domain";

export const url =
  "https://eventsearch.xcmdata.org/HistoricalEventSearch/xcmEvent/getEventById";

export type InitialEvent = {
  type: ":INITIAL";
  payload: {
    etl_work_dir: string;
  };
  meta: { subtask_name: "download_transcom_events" };
};

export type FinalEvent = {
  type: ":FINAL";
};

const DEFAULT_BATCH_SIZE = 100;
const DEFAULT_SLEEP_MS = 5 * 1000;

export function createNewEventsWriteStream(etl_work_dir: string) {
  const file_name = `raw-transcom-events-expanded.${getTimestamp()}.ndjson.gz`;

  const file_path = getRawTranscomEventsFilePath(etl_work_dir, file_name);

  const ws = createWriteStream(file_path);
  const gzip = createGzip();

  const is_done = new Promise<void>((resolve, reject) => {
    ws.once("error", reject);
    ws.once("finish", resolve);
  });

  gzip.pipe(ws);

  return { file_name, file_path, write_stream: gzip, is_done };
}

export async function downloadRawTranscomEventsExpanded(
  transcom_event_ids: string[],
  fetch_options: any
): Promise<RawTranscomEventExpanded[]> {
  if (transcom_event_ids.length === 0) {
    return [];
  }

  const reqUrl = `${url}?id=${transcom_event_ids.join("&id=")}&m=${Math.random()}`;

  const response = await fetch(reqUrl, fetch_options);

  // @ts-ignore
  const { data } = await response.json();

  // logger.silly(JSON.stringify({ data }, null, 4));

  return data;
}

// TODO: validator function that wraps the Iterator
export async function* makeRawTranscomEventsExpandedIteratorFromTranscomAPI(
  etl_work_dir: string,
  batch_size: number = DEFAULT_BATCH_SIZE,
  sleep_ms: number = DEFAULT_SLEEP_MS
): AsyncGenerator<RawTranscomEventExpanded> {
  const sqlite_db = getEtlContextLocalStateSqliteDb(etl_work_dir);

  const select_batch_ids_stmt = sqlite_db.prepare(`
      SELECT
          event_id
        FROM seen_event
      EXCEPT
      SELECT
          event_id
        FROM downloaded_event
      ORDER BY event_id
      LIMIT ${batch_size}
    ;
  `);

  const tokenCollector = new TranscomAuthTokenCollector();
  let authenticationtoken = await tokenCollector.getJWT();

  let mustSleep = false;

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

  while (true) {
    const batch = select_batch_ids_stmt.pluck().all();

    logger.silly(JSON.stringify({ batch }, null, 4));

    if (batch.length === 0) {
      break;
    }

    if (mustSleep) {
      await new Promise((resolve) => setTimeout(resolve, sleep_ms));
      mustSleep = false;
    }

    while (
      ! required_historical_event_cookies.every(name => tokenCollector.historicalEventSearchCookies?.[name])
    ) {
      await sleep(1000)
    }

    const cookies = await tokenCollector.getCookies();

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
      method: "GET",
      headers: headers,
      mode: "cors",
      credentials: "include",
    };

    const eventsExpandedData = await downloadRawTranscomEventsExpanded(
      batch,
      options
    );

    mustSleep = true;

    for (const data of eventsExpandedData) {
      yield data;
    }
  }

  await tokenCollector.close();
}

export default async function downloadTranscomEventsExpanded(
  etl_work_dir: string,
  batch_size: number = DEFAULT_BATCH_SIZE,
  sleep_ms: number = DEFAULT_SLEEP_MS
) {
  verifyIsInTaskEtlContext();

  const events = await dama_events.getAllEtlContextEvents();

  let final_event = events.find((e) => e.type === ":FINAL");

  if (final_event) {
    logger.info("Task already DONE");
    return final_event;
  }

  const sqlite_db = getEtlContextLocalStateSqliteDb(etl_work_dir);

  const insert_downloaded_id_stmt = sqlite_db.prepare(`
    INSERT INTO downloaded_event ( event_id, file_name )
      VALUES ( ?, ? )
      ON CONFLICT( event_id ) DO NOTHING
    ;
  `);

  const iter = makeRawTranscomEventsExpandedIteratorFromTranscomAPI(
    etl_work_dir,
    batch_size,
    sleep_ms
  );

  let file_name: string;
  let write_stream: Gzip;
  let is_done: Promise<void>;

  let count = 0;
  try {
    for await (const event of iter) {
      if (count++ % batch_size === 0) {
        // @ts-ignore
        if (write_stream) {
          write_stream.end();
          // @ts-ignore
          await is_done;

          sqlite_db.exec("COMMIT ;");
        }

        ({ file_name, write_stream, is_done } =
          createNewEventsWriteStream(etl_work_dir));

        sqlite_db.exec("BEGIN ;");
      }

      // @ts-ignore
      const ready = write_stream.write(`${JSON.stringify(event)}\n`);

      if (!ready) {
        await new Promise((resolve) => write_stream.once("drain", resolve));
      }

      const { ID } = event;

      // @ts-ignore
      insert_downloaded_id_stmt.run(ID, file_name);
    }

    if (count) {
      // @ts-ignore
      write_stream.end();

      // @ts-ignore
      await is_done;

      sqlite_db.exec("COMMIT ;");
    }

    logger.info(`Downloaded ${count} events."`);

    final_event = {
      type: ":FINAL",
    };

    await dama_events.dispatch(final_event);

    return final_event;
  } catch (err) {
    console.error(err);
    // sqlite_db.exec("ROLLBACK; ");

    // @ts-ignore
    if (file_name) {
      const file_path = getRawTranscomEventsFilePath(etl_work_dir, file_name);

      rmSync(file_path);
    }

    const err_event = {
      type: ":ERROR",
      payload: {
        message: (<Error>err).message,
        stack: (<Error>err).stack,
      },
    };

    await dama_events.dispatch(err_event);

    throw err;
  }
}
