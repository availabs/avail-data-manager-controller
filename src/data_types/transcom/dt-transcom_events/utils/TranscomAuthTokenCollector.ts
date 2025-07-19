import puppeteer, { Browser, Page } from "puppeteer";

import credentials from "../config/transcom_credentials.json";

import logger from "data_manager/logger";

import { sleep } from "data_utils/time";

export default class TranscomAuthTokenCollector {
  _browser_p: Promise<Browser> | null;
  _page?: Page;
  jwt_token_p?: Promise<string>;
  page_cookies_p?: Promise<any[]>;
  historicalEventSearchCookies?: Record<string, string>;
  refresh_token_inteval?: ReturnType<typeof setInterval>;
  private _isClosing: boolean = false;

  constructor() {
    this._browser_p = null;
  }

  async getJWT() {
    if (!this._browser_p) {
      await this.start();
    }

    let token: string | undefined;

    while (!(token = await this.jwt_token_p)) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    logger.silly(`TranscomAuthTokenCollector: returning token ${token}`);

    return token;
  }

  // NOTE: These are the general cookies.
  //       HistoricalEventSearch requires specific cookies collected from Server responses's "set-cookie" headers.
  async getCookies() {
    if (!this._browser_p) {
      await this.start();
    }

    let cookies: any[] | undefined;

    while (!(cookies = await this.page_cookies_p)) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const cookies_obj = cookies.reduce((acc, { name, value }) => {
      acc[name] = value;
      return acc;
    }, {});

    return cookies_obj;
  }

  async getCookieString() {
    if (!this._page || this._page.isClosed()) {
      throw new Error("Page is closed or not available");
    }
    return this._page.evaluate(() => document.cookie);
  }

  private async start() {
    if (!this._browser_p) {
      logger.debug("TranscomAuthTokenCollector: creating puppeteer browser");

      this._browser_p = puppeteer.launch({ headless: true });

      const browser = await this._browser_p;

      const page = await browser.newPage();

      this._page = page;

      await page.setRequestInterception(true);

      let last_req_timestamp = Date.now();

      page.on("request", (request) => {
        // Because waitForNetworkIdle wasn't working.
        last_req_timestamp = Date.now();

        request.continue();
      });

      page.on("response", (response) => {
        const response_url = response.url();

        if (/HistoricalEventSearch/.test(response_url)) {
          const response_headers = response.headers();

          if (response_headers["set-cookie"]) {
            const cookies = response_headers["set-cookie"]
              .split("; ")
              .reduce((acc, c) => {
                let [k, v] = c.split("=");

                if (v) {
                  k = k.replace(/^.*\n/, "");
                  acc[encodeURI(k)] = encodeURI(v);
                }

                return acc;
              }, {});

            const needed = ["JSESSIONID", "XSRF-Cookie", "Anti-Forgery-Cookie"];

            let updated = false;
            for (const name of needed) {
              if (cookies[name]) {
                this.historicalEventSearchCookies =
                  this.historicalEventSearchCookies || {};
                this.historicalEventSearchCookies[name] = cookies[name];
                updated = true;
              }
            }
          }
        }
      });

      logger.debug("TranscomAuthTokenCollector: creating puppeteer page");

      await page.goto("https://xcmdfe1.xcmdata.org/SSO/#!/login");

      await page.waitForNetworkIdle();

      await page.waitForSelector("#username");

      // Type into search box.
      await page.type("#lgnName", credentials.username);
      await page.type(
        "#loginDiv > div > div.login-inner-box > form > div:nth-child(3) > input",
        credentials.password,
        {
          delay: 100,
        }
      );

      await sleep(1000);

      await page.click(".btn");

      await page.waitForNetworkIdle({
        timeout: 1_000 * 60 * 15,
      });

      logger.debug("TranscomAuthTokenCollector: logged in");

      const historical_event_search_url =
        "https://xcmdfe1.xcmdata.org/SSO/#!/home/app/HistoricalEventSearch";

      console.log("awaiting navigation to", historical_event_search_url);
      await page.goto(historical_event_search_url);

      // Because page.waitForNetworkIdle never happened,
      let cur_url = page.url();
      // Wait until we navigate to HistoricalEventSearch
      while (cur_url !== historical_event_search_url) {
        await sleep(1000);
        cur_url = page.url();
      }
      // Wait until no recent requests
      while (Date.now() - last_req_timestamp < 2000) {
        await sleep(1000);
      }

      logger.debug(
        "TranscomAuthTokenCollector: navigated to /home/app/HistoricalEventSearch"
      );

      this.refresh_token_inteval = setInterval(async () => {
        try {
          // Check if we're closing or if page/browser is closed
          if (this._isClosing || !this._page || this._page.isClosed()) {
            logger.debug("TranscomAuthTokenCollector: skipping token refresh - page closed or closing");
            return;
          }

          let retries = 0;
          logger.silly("TranscomAuthTokenCollector: refreshing token");

          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Double-check page is still available before using it
          if (this._page && !this._page.isClosed()) {
            this.jwt_token_p = this._page.evaluate(() => {
              try {
                const usrStr = <string>localStorage.getItem("user");
                const { jwtToken } = JSON.parse(usrStr);
                return jwtToken;
              } catch (err) {
                console.error(err);
                return undefined;
              }
            });

            this.page_cookies_p = this._page.cookies();

            // If the page.evaluate above returns undefined, it will continue to do so.
            if ((await this.jwt_token_p) === undefined) {
              if (++retries === 10) {
                logger.warn("TranscomAuthTokenCollector: failed to get token after 10 retries, restarting");
                await this.close();
                return await this.start();
              }
            }

            logger.silly(
              `TranscomAuthTokenCollector: typeof this.jwt_token_p ${typeof this
                .jwt_token_p}`
            );

            logger.silly(
              `TranscomAuthTokenCollector: this.jwt_token_p=${await this
                .jwt_token_p}`
            );
          }
        } catch (err) {
          logger.error("TranscomAuthTokenCollector: error in token refresh interval:", err);
          // Don't restart automatically on every error, just log it
          // The calling code should handle retries
        }
      }, 5000);
    }
  }

  async close() {
    this._isClosing = true;

    if (this.refresh_token_inteval) {
      clearInterval(this.refresh_token_inteval);
      this.refresh_token_inteval = undefined;
    }

    if (this._browser_p) {
      try {
        const browser = await this._browser_p;
        this._browser_p = null;
        this._page = undefined;
        await browser.close();
      } catch (err) {
        logger.error("TranscomAuthTokenCollector: error closing browser:", err);
      }
    }

    this._isClosing = false;
  }
}
