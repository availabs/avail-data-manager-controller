import { runInDamaContext, EtlContext } from "data_manager/contexts";

import transform_main from ".";

export default (etl_context: EtlContext) =>
  runInDamaContext(etl_context, transform_main);
