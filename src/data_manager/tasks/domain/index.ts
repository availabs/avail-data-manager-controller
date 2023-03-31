import { ExecaChildProcess } from "execa";
import { Job, Worker } from "pg-boss";

export type DamaTaskQueueName = Worker["name"];
export type DamaTaskId = Job["id"];

export type DamaTaskDescriptor = {
  dama_task_queue_name?: DamaTaskQueueName;
  parent_context_id?: number | null;
  source_id?: number | null;
  initial_event: {
    type: string;
    payload: any;
    meta?: any | null;
  };
  worker_path: string;
};

export type DamaTaskMetadata = DamaTaskDescriptor & {
  task_id: DamaTaskId | null; // null if task not yet started
  etl_context_id: number;
  initial_event: DamaTaskDescriptor["initial_event"] & {
    event_id: number;
    etl_context_id: number;
  };
};

export type DamaTaskJob = Job & {
  data: {
    etl_context_id: number;
    worker_path: string;
  };
};

export type DamaTask = {
  etl_context_id: number;
  worker_path: string;
  task_id: string;
  task_process: ExecaChildProcess | null;
};

export enum DamaTaskExitCodes {
  DONE = 0,
  COULD_NOT_ACQUIRE_INITIAL_EVENT_LOCK = 100,
  WORKER_THREW_ERROR = 101,
  WORKER_DID_NOT_RETURN_FINAL_EVENT = 102,
}
