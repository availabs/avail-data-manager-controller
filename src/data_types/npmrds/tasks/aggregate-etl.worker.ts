import { runInDamaContext, EtlContext } from "data_manager/contexts";

import main from "./aggregate-etl";

export default async (etl_context: EtlContext) =>
  runInDamaContext(etl_context, main);
