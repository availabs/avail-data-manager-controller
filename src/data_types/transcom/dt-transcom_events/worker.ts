import { runInDamaContext, EtlContext } from "data_manager/contexts";

import main from ".";

export default (etl_context: EtlContext) => runInDamaContext(etl_context, main);
