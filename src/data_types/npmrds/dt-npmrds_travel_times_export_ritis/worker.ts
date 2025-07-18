import { runInDamaContext, TaskEtlContext } from "data_manager/contexts";

import main from ".";

export default (task_etl_context: TaskEtlContext) =>
  runInDamaContext(task_etl_context, main);
