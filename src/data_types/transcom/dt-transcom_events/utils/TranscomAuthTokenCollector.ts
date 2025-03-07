import puppeteer, { Browser } from "puppeteer";

import credentials from "../config/transcom_credentials.json";

import logger from "data_manager/logger";

import { sleep } from "data_utils/time";

export default class TranscomAuthTokenCollector {
  _browser_p: Promise<Browser> | null;
  jwt_token_p?: Promise<string>;
  refresh_token_inteval?: ReturnType<typeof setInterval>;

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

    let cookies: array | undefined;

    while (!(cookies = await this.page_cookies_p)) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const cookies_obj = cookies.reduce((acc, {name, value}) => {
        acc[name] = value;
  return acc
    }, {});

    return cookies_obj;
  }

  async getCookieString() {
    return this._page.evaluate(() => document.cookie)
  }

  private async start() {
    if (!this._browser_p) {
      logger.debug("TranscomAuthTokenCollector: creating puppeteer browser");

      this._browser_p = puppeteer.launch({ headless: true });

      const browser = await this._browser_p;

      const page = await browser.newPage();

      this._page= page

      await page.setRequestInterception(true);

      let last_req_timestamp = Date.now()

      page.on('request', request => {
        // Because waitForNetworkIdle wasn't working.
        last_req_timestamp = Date.now()

        request.continue();
      })

      page.on('response', response => {
        const response_url = response.url();

        if (/HistoricalEventSearch/.test(response_url)) {
          const response_headers = response.headers();

          if (response_headers['set-cookie']) {
            const cookies = response_headers['set-cookie']
              .split('; ')
              .reduce((acc, c) => {
                      let [k, v] = c.split('=')

                if (v) {
                        k = k.replace(/^.*\n/, '')
                  acc[encodeURI(k)] = encodeURI(v)
                }

                return acc
              }, {})

            const needed = [
              'JSESSIONID',
              'XSRF-Cookie',
              'Anti-Forgery-Cookie'
            ]

            let updated = false;
            for (const name of needed) {
              if (cookies[name]) {
                this.historicalEventSearchCookies = this.historicalEventSearchCookies || {}
                this.historicalEventSearchCookies[name] = cookies[name]
                updated = true;
              }
            }

            // if (updated) {
            //   console.log('v'.repeat(10), ' set-cookie ', 'v'.repeat(10))
            //   console.log('response_url:', response_url)
            //   console.log(JSON.stringify(response_headers, null, 4))
            //   console.log(JSON.stringify(this.historicalEventSearchCookies, null, 4))
            //   console.log('^'.repeat(30))
            //   console.log('v'.repeat(10), ' set-cookie ', 'v'.repeat(10))
            // }
          }
        }
      })

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

      // await page.goto("https://xcmdfe1.xcmdata.org/SSO/#!/home/app/default");
      const historical_event_search_url = "https://xcmdfe1.xcmdata.org/SSO/#!/home/app/HistoricalEventSearch"

      console.log('awaiting navigation to', historical_event_search_url)
      await page.goto(historical_event_search_url);

      // Because page.waitForNetworkIdle never happened,
      let cur_url = page.url();
      // Wait until we navigage to HistoricalEventSearch
      while( cur_url !== historical_event_search_url ) {
        await sleep(1000);
        cur_url = page.url();
      }
      // Wait until no
      while (Date.now() - last_req_timestamp > 2000) {
        await sleep(1000)
      }

      logger.debug("TranscomAuthTokenCollector: navigated to /home/app/HistoricalEventSearch");

      this.refresh_token_inteval = setInterval(async () => {
        try {
          let retries = 0;
          logger.silly("TranscomAuthTokenCollector: refreshing token");

          await new Promise((resolve) => setTimeout(resolve, 2000));

          this.jwt_token_p = page.evaluate(() => {
            try {
              const usrStr = <string>localStorage.getItem("user");
              const { jwtToken } = JSON.parse(usrStr);
              return jwtToken;
            } catch (err) {
              console.error(err);
            }
          });

          this.page_cookies_p = page.cookies()

          //  If the page.evaluate above returns undefined, it will continue to do so.
          if ((await this.jwt_token_p) === undefined) {
            if (++retries === 10) {
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
        } catch (err) {
          console.error(err);
        }
      }, 5000);
    }
  }

  async close() {
    if (this._browser_p) {
      clearInterval(this.refresh_token_inteval);

      const browser = await this._browser_p;

      this._browser_p = null;

      await browser.close();
    }
  }
}
