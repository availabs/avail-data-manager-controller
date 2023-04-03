import { join } from "path";

import { Context } from "moleculer";
import { FSA } from "flux-standard-action";

import dama_events from "../../../events";
import { getPgEnv, runInDamaContext } from "../../../contexts";
import { getLoggerForContext } from "../../../logger";

export const service_name = "data_manager/tasks/examples/simple_foo_bar";

const dama_task_queue_name = service_name;

const worker_path = join(__dirname, "./worker.ts");

// AVAIL_LOGGING_LEVEL=silly AVAIL_DAMA_PG_ENV=dama_dev_1 AVAIL_DAMA_ETL_CONTEXT_ID=495 node --require ts-node/register src/data_manager/tasks/TaskRunner.ts

export default {
  name: service_name,

  dependencies: ["dama/tasks"],

  actions: {
    startDamaTaskQueue: {
      visibility: "public",

      async handler(ctx: Context) {
        await ctx.call("dama/tasks.registerTaskQueue", {
          dama_task_queue_name,
          options: {
            teamSize: 10,
            teamConcurrency: 10,
            temRefil: true,
            // batchSize: 3,
          },
        });

        await ctx.call("dama/tasks.startDamaQueueWorker", {
          dama_task_queue_name,
        });
      },
    },

    sendIt: {
      visibility: "public",

      async handler(ctx: Context) {
        const dama_task_descr = {
          dama_task_queue_name,
          worker_path,
        };

        const options = { retryLimit: 2, expireInSeconds: 30 };

        // @ts-ignore
        const { etl_context_id } = await ctx.call("dama/tasks.queueDamaTask", {
          dama_task_descr,
          options,
        });

        dama_events.registerEtlContextFinalEventListener(
          etl_context_id,
          (final_event) => {
            console.log("===== Dama Task Done =====");
            console.log(JSON.stringify({ final_event }, null, 4));
            console.log("==========================");
          }
        );
      },
    },

    // mol $ call data_manager/tasks/examples/simple_foo_bar.runWorkerOutsideDamaQueue --#pgEnv dama_dev_1
    runWorkerOutsideDamaQueue: {
      visibility: "public",

      async handler() {
        try {
          const etl_context_id = await dama_events.spawnEtlContext();

          const pgEnv = getPgEnv();
          const logger = getLoggerForContext(etl_context_id);

          const ctx = {
            logger,
            meta: {
              pgEnv,
              etl_context_id,
            },
          };

          await runInDamaContext(ctx, async () => {
            const initial_event = {
              type: ":INITIAL",
              payload: { delay: 5000, msg: "Hello, World!." },
            };

            // @ts-ignore
            await dama_events.dispatch(initial_event);

            const {
              default: main,
            }: {
              default: (initial_event: FSA) => FSA | Promise<FSA> | unknown;
            } = await import(worker_path);

            // @ts-ignore
            const final_event = <FSA>await main(initial_event);

            await dama_events.dispatch(<FSA>final_event);

            logger.debug(
              `simple_foo_bar pg_env=${pgEnv} etl_context_id=${etl_context_id} DONE`
            );
          });
        } catch (err) {
          console.error(err);
        }
      },
    },
  },
};
