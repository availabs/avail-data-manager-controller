import { join } from "path";
import dama_host_id from "constants/damaHostId";
import dama_meta from "data_manager/meta";
import serviceName from "../constants/serviceName";

import { checkCurrentSourceInQueue } from "./actions";

export default {
  name: `${serviceName}.tigerDownloadAction`,
  actions: {
    load: {
      visibility: "published",

      async handler(ctx: any) {
        let source: Record<string, any>;
        let source_id: number | null = ctx?.params?.source_id;
        const type = `tl_${ctx?.params?.table_name?.toLowerCase()}`;
        const isNewSourceCreate: boolean = source_id ? false : true;

        const res: Record<string, any> = await checkCurrentSourceInQueue(type);

        if (res?.status === "success" && res?.source_id !== null) {
          return {
            etl_context_id: res?.etl_context_id,
            source_id: res?.source_id,
            source_name: res?.source_name,
            isNewSource: false,
          };
        }

        if (!source_id) {
          source = await dama_meta.createNewDamaSource({
            name: ctx?.params?.source_name,
            type,
          });

          source_id = source?.source_id;
          ctx.params.source_id = source_id;
        }

        const worker_path = join(__dirname, "./load.worker.ts");

        const dama_task_descr = {
          worker_path,
          parent_context_id: null,
          source_id,
          initial_event: {
            type: "Tiger_Dataset:INITIAL",
            payload: Object.assign({}, ctx?.params, {
              isNewSourceCreate,
            }),
            meta: {
              __dama_task_manager__: {
                dama_host_id,
                worker_path,
              },
            },
          },
        };

        const options = { retryLimit: 0, expireInSeconds: 30000 };

        const { etl_context_id } = await ctx.call("dama/tasks.queueDamaTask", {
          dama_task_descr,
          options,
        });

        return { etl_context_id, source_id, isNewSource: true };
      },
    },
  },
};
