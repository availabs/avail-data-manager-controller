import { join } from "path";

import dama_db from "data_manager/dama_db";
import dama_events, { EtlEvent, DamaEvent } from "data_manager/events";

import {
  getEtlContextId,
  verifyIsInTaskEtlContext,
} from "data_manager/contexts";

import getEtlWorkDir from "var/getEtlWorkDir";

import BaseTasksController from "data_manager/tasks/BaseTasksController";
import { DamaTaskDescriptor } from "data_manager/tasks/domain";

import { TaskQueue, NpmrdsExportTransformOutput } from "../domain";
import { PipelineInitialEvent, IngestInitialEvent } from "./domain";

import { FinalEvent as TransformFinalEvent } from "./tasks/transform";

// Paths to the new task workers
const ingest_worker_path = join(
  __dirname,
  "./tasks/ingest_from_uuids/worker.ts"
);
const transform_worker_path = join(__dirname, "./tasks/transform/worker.ts");

export type DoneData = NpmrdsExportTransformOutput;

export type FinalEvent = {
  type: ":FINAL";
  payload: DoneData;
};

enum SubtaskEventType {
  INGEST_QUEUED = "INGEST_QUEUED",
  TRANSFORM_QUEUED = "TRANSFORM_QUEUED",
}

async function _ingest(task_controller: BaseTasksController) {
  const events = await dama_events.getAllEtlContextEvents();

  let ingest_queued_event: EtlEvent | undefined = events.find(
    ({ type }) => type === SubtaskEventType.INGEST_QUEUED
  );

  if (!ingest_queued_event) {
    const {
      payload: { ritis_uuids },
    } = <PipelineInitialEvent>events[0];

    const ingest_initial_event: IngestInitialEvent = {
      type: ":INITIAL",
      payload: { ritis_uuids },
      meta: { note: "ingest npmrds export from RITIS uuids" },
    };

    const ingest_task_desc: DamaTaskDescriptor = {
      worker_path: ingest_worker_path,
      dama_task_queue_name: TaskQueue.DOWNLOAD_EXPORT, // We can reuse the same queue
      parent_context_id: getEtlContextId(),
      initial_event: ingest_initial_event,
      // NOTE: The etl_work_dir will be set the Root ETL Context's, which is the Ingest's ParentContext.
      //       This allows the Transform Subtask to use the same etl_work_dir.
      etl_work_dir: getEtlWorkDir(),
    };

    const { etl_context_id: ingest_eci } = await task_controller.queueDamaTask(
      ingest_task_desc,
      {
        retryLimit: 0,
        expireInHours: 1,
      }
    );

    ingest_queued_event = {
      type: SubtaskEventType.INGEST_QUEUED,
      payload: {
        etl_context_id: ingest_eci,
      },
    };

    await dama_events.dispatch(ingest_queued_event);
  }

  const {
    payload: { etl_context_id: ingest_eci },
  } = <DamaEvent>ingest_queued_event;

  // We wait for the final event of the ingest task to ensure it's complete.
  await dama_events.getEventualEtlContextFinalEvent(ingest_eci);
}

async function _transform(task_controller: BaseTasksController) {
  const events = await dama_events.getAllEtlContextEvents();

  let transform_queued_event: EtlEvent | undefined = events.find(
    ({ type }) => type === SubtaskEventType.TRANSFORM_QUEUED
  );

  if (!transform_queued_event) {
    const transform_initial_event = {
      type: ":INITIAL",
      payload: null, // The transform task now gets its metadata from the context
      meta: { note: "transform download" },
    };

    const transform_task_desc: DamaTaskDescriptor = {
      worker_path: transform_worker_path,
      dama_task_queue_name: TaskQueue.TRANSFORM_EXPORT,
      parent_context_id: getEtlContextId(),
      initial_event: transform_initial_event,
      // NOTE: The etl_work_dir will be set the Root ETL Context's, which is the Ingest's ParentContext.
      //       This allows the Transform Subtask to use the same etl_work_dir.
      etl_work_dir: getEtlWorkDir(),
    };

    const { etl_context_id } = await task_controller.queueDamaTask(
      transform_task_desc,
      {
        retryLimit: 0,
        expireInHours: 24 * 7,
      }
    );

    transform_queued_event = {
      type: SubtaskEventType.TRANSFORM_QUEUED,
      payload: {
        etl_context_id,
      },
    };

    await dama_events.dispatch(transform_queued_event);
  }

  const {
    payload: { etl_context_id },
  } = <DamaEvent>transform_queued_event;

  const transform_final_event = <TransformFinalEvent>(
    await dama_events.getEventualEtlContextFinalEvent(etl_context_id)
  );

  return transform_final_event.payload;
}

export default async function main(): Promise<DoneData> {
  verifyIsInTaskEtlContext();

  const events = await dama_events.getAllEtlContextEvents();

  let final_event = events.find(({ type }) => type === ":FINAL");

  if (final_event) {
    return final_event.payload;
  }

  // I don't recall why this is here, rather than atop the file.
  // I think it has to do with not firing up the controller whenever this file is imported.
  const task_controller = new BaseTasksController();

  // SERIAL: Ingest must finish before Transform is queued.
  await _ingest(task_controller);

  const transform_done_data = await _transform(task_controller);

  final_event = {
    type: ":FINAL",
    payload: transform_done_data,
  };

  await dama_events.dispatch(final_event);

  return transform_done_data;
}
