import { readFile as readFileAsync } from "fs/promises";
import { join } from "path";

import _ from "lodash";

import { Context } from "moleculer";

import { FSA } from "flux-standard-action";

import getPgEnvFromCtx from "../dama_utils/getPgEnvFromContext";

import { NodePgPool, getConnectedNodePgPool } from "./postgres/PostgreSQL";

export type ServiceContext = Context & {
  params: FSA;
};

type LocalVariables = {
  // Promise because below we only want to getDb once and this._local_.db is our "once" check.
  dbs: Record<string, Promise<NodePgPool>>;
};

export default {
  name: "dama_db",

  methods: {
    async initializeDamaTables(
      pgEnv: string,
      db?: NodePgPool // NOTE: Only this.getDb should set db
    ) {
      if (!db) {
        // Allow this.getDb to re-call initializeDamaTables after connecting to the Database.
        return this.getDb(pgEnv);
      }

      const initializeDamaSchemasSql = await readFileAsync(
        join(__dirname, "./sql/data_manager_schema.sql"),
        { encoding: "utf8" }
      );

      //  If the core dama tables already exist, this will throw.
      try {
        // @ts-ignore
        await (<Promise>db.query("BEGIN"));
        // @ts-ignore
        await (<Promise>db.query(initializeDamaSchemasSql));
        // @ts-ignore
        await (<Promise>db.query("COMMIT"));
      } catch (err) {
        // @ts-ignore
        await (<Promise>db.query("ROLLBACK"));
        // console.error(err);
      }

      const createTablesSql = await readFileAsync(
        join(__dirname, "./sql/create_event_sourcing_table.sql"),
        { encoding: "utf8" }
      );

      // @ts-ignore
      await (<Promise>db.query(createTablesSql));
    },

    async getDb(pgEnv: string) {
      if (!this._local_.dbs[pgEnv]) {
        let ready: Function;

        this._local_.dbs[pgEnv] = new Promise((resolve) => {
          ready = resolve;
        });

        const db = await getConnectedNodePgPool(pgEnv);

        await this.initializeDamaTables(pgEnv, db);

        // @ts-ignore
        ready(db);
      }

      return this._local_.dbs[pgEnv];
    },
  },

  actions: {
    initializeDamaTables: {
      visibility: "public",

      handler(ctx: Context) {
        // @ts-ignore
        const pgEnv = ctx.meta.pgEnv;

        if (!pgEnv) {
          throw new Error("ctx.meta.pgEnv is not set");
        }

        return this.initializeDamaTables(pgEnv);
      },
    },

    getDb: {
      visibility: "protected", // can be called only from local services

      handler(ctx: Context) {
        const pgEnv = getPgEnvFromCtx(ctx);

        return this.getDb(pgEnv);
      },
    },

    // https://node-postgres.com/api/pool#releasecallback
    // > The releaseCallback releases an acquired client back to the pool.
    // MUST release the connection when done.
    getDbConnection: {
      visibility: "protected",

      async handler(ctx: Context) {
        const pgEnv = getPgEnvFromCtx(ctx);

        const db = <NodePgPool>await this.getDb(pgEnv);

        const connection = await db.connect();

        return connection;
      },
    },

    //  Execute a query or array of queries.
    //    Works with
    //      * SQL strings
    //      * node-postgres query config objects
    //        see: https://node-postgres.com/features/queries#query-config-object
    query: {
      visibility: "protected", // can be called only from local services

      // https://node-postgres.com/features/queries#query-config-object
      async handler(ctx: Context) {
        const {
          // @ts-ignore
          params,
        } = ctx;

        const pgEnv = getPgEnvFromCtx(ctx);

        const multiQueries = Array.isArray(params);
        const queries = multiQueries ? params : [params];

        const db = <NodePgPool>await this.getDb(pgEnv);

        const connection = await db.connect();

        const results = [];

        // @ts-ignore
        for (const q of queries) {
          console.log(JSON.stringify(q, null, 4));
          // @ts-ignore
          results.push(await db.query(q));
        }

        connection.release();

        return multiQueries ? results : results[0];
      },
    },
  },

  created() {
    this._local_ = <LocalVariables>{
      dbs: {},
    };
  },

  async stopped() {
    try {
      Object.keys(this._local_.dbs).forEach(async (pgEnv) => {
        try {
          await this._local_.dbs[pgEnv].end();
        } catch (err) {
          // ignore
        }
      });
    } catch (err) {
      // ignore
    }
  },
};
