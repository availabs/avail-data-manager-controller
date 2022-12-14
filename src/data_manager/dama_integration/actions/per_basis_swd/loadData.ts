import {Context} from "moleculer";
import {PoolClient, QueryConfig, QueryResult} from "pg";
import dedent from "dedent";
import pgFormat from "pg-format";
import EventTypes from "../../constants/EventTypes";
import {per_basis_swd} from "./sqls";

const update_view = async (ncei_schema, table_name, view_id, dbConnection, sqlLog, resLog) => {
  const updateViewMetaSql = dedent(
    `
      UPDATE data_manager.views
      SET table_schema = $1,
          table_name   = $2,
          data_table   = $3
      WHERE view_id = $4
    `
  );

  const data_table = pgFormat("%I.%I", ncei_schema, `${table_name}_${view_id}`);

  const q = {
    text: updateViewMetaSql,
    values: [ncei_schema, `${table_name}_${view_id}`, data_table, view_id],
  };

  sqlLog.push(q);
  const res = await dbConnection.query(q);
  resLog.push(res);
};

export default async function publish(ctx: Context) {
  // throw new Error("publish TEST ERROR");

  let {
    // @ts-ignore
    params: {etl_context_id, table_name, src_id, view_id, ncei_table, ncei_schema},
  } = ctx;
  //
  if (!(etl_context_id)) {
    const etlcontextid = await ctx.call(
      "dama_dispatcher.spawnDamaContext",
      {etl_context_id: null}
    );
    etl_context_id = etlcontextid;
    throw new Error("The etl_context_id parameter is required.");
  }

  const dbConnection: PoolClient = await ctx.call("dama_db.getDbConnection");
  const sqlLog: any[] = [];
  const resLog: QueryResult[] = [];

  // let view_id = 13
  try {
    let res: QueryResult;

    sqlLog.push("BEGIN ;");
    res = await dbConnection.query("BEGIN ;");
    resLog.push(res);

    // create schema
    const createSchema = `CREATE SCHEMA IF NOT EXISTS ${ncei_schema};`;
    sqlLog.push(createSchema);
    res = await ctx.call("dama_db.query", {
      text: createSchema
    });
    resLog.push(res);
    console.log("see this:", res.rows);

    // create table
    sqlLog.push(per_basis_swd(table_name, view_id, ncei_schema, ncei_table));
    console.log('sq;', per_basis_swd(table_name, view_id, ncei_schema, ncei_table))
    res = await ctx.call("dama_db.query", {
      text: per_basis_swd(table_name, view_id, ncei_schema, ncei_table)
    });
    resLog.push(res);
    console.log("see this:", res.rows);

    await dbConnection.query("COMMIT;");


    // update view meta
    await update_view(ncei_schema, table_name, view_id, dbConnection, sqlLog, resLog);

    await dbConnection.query("COMMIT;");

    console.log("uploaded!");

    // We need the data_manager.views id
    await dbConnection.query("COMMIT;");
    dbConnection.release();

    const finalEvent = {
      type: EventTypes.FINAL,
      payload: {
        data_manager_view_id: -1,
        createSchema: sqlLog,
        createTable: sqlLog,
        publishCmdResults: resLog,
      },
      meta: {
        timestamp: new Date().toISOString(),
        etl_context_id
      },
    };

    await ctx.call("dama_dispatcher.dispatch", finalEvent);

    return finalEvent;
  } catch (err) {
    console.error(err);

    const errEvent = {
      type: EventTypes.PUBLISH_ERROR,
      payload: {
        message: err.message,
        successfulcreateSchema: sqlLog,
        successfulcreateTable: sqlLog,
        successfulPublishCmdResults: resLog,
      },
      meta: {
        timestamp: new Date().toISOString(),
        etl_context_id
      },
    };

    await ctx.call("dama_dispatcher.dispatch", errEvent);

    await dbConnection.query("ROLLBACK;");

    throw err;
  }
}
