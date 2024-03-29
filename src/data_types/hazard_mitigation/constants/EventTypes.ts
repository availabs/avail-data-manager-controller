import serviceName from "./serviceName";

export default {
  INITIAL: `${serviceName}:INITIAL`,
  FINISH_GIS_FILE_UPLOAD: `${serviceName}:FINISH_GIS_FILE_UPLOAD`,
  GIS_FILE_UPLOAD_PROGRESS: `${serviceName}:GIS_FILE_UPLOAD_PROGRESS`,
  GIS_FILE_RECEIVED: `${serviceName}:GIS_FILE_RECEIVED`,
  START_GIS_FILE_UPLOAD_ANALYSIS: `${serviceName}:START_GIS_FILE_UPLOAD_ANALYSIS`,
  GIS_FILE_UPLOAD_ERROR: `${serviceName}:GIS_FILE_UPLOAD_ERROR`,

  LOAD_REQUEST: `${serviceName}:LOAD_REQUEST`,

  STAGE_LAYER_DATA_REQUEST: `${serviceName}:STAGE_LAYER_DATA_REQUEST`,
  LAYER_DATA_STAGED: `${serviceName}:LAYER_DATA_STAGED`,

  QA_REQUEST: `${serviceName}:QA_REQUEST`,
  QA_APPROVED: `${serviceName}:QA_APPROVED`,

  READY_TO_PUBLISH: `${serviceName}:READY_TO_PUBLISH`,

  NOT_READY_TO_PUBLISH: `${serviceName}:NOT_READY_TO_PUBLISH`,

  PUBLISH: `${serviceName}:PUBLISH`,

  PUBLISH_ERROR: `${serviceName}:PUBLISH_ERROR`,

  FINAL: `${serviceName}:FINAL`,
};
