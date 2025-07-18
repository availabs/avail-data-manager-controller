import { runInDamaContext, EtlContext } from "data_manager/contexts";

import ingest_main from ".";

export default async (etl_context: EtlContext) =>
  runInDamaContext(etl_context, ingest_main);
