import * as turf from "@turf/turf";

import { DataDateRange } from "data_types/npmrds/domain";

// re-exporting for convenience
export type {
  NpmrdsExportTransformOutput,
  NpmrdsExportRequest,
  NpmrdsExportMetadata,
} from "../../domain";

import {
  NpmrdsTmc,
  NpmrdsDataYear,
  NpmrdsDownloadName,
  NpmrdsState,
} from "../../domain";

export enum RitisExportNpmrdsDataSource {
  ALL_VEHICLES = "ALL_VEHICLES",
  PASSENGER_VEHICLES = "PASSENGER_VEHICLES",
  TRUCKS = "TRUCKS",
}

export type NpmrdsDownloadRequest = {
  readonly name: NpmrdsDownloadName;
  readonly year: NpmrdsDataYear;
  readonly state: NpmrdsState;
  readonly is_expanded: boolean;
  readonly date_range: DataDateRange;
};

export type NpmrdsDownloadUrls = Record<RitisExportNpmrdsDataSource, string>;

export type NpmrdsTmcGeoJsonFeature = turf.Feature<
  turf.LineString | turf.MultiLineString
> & { id: NpmrdsTmc };

export enum MassiveDataDownloaderDataMeasure {
  speed = "speed",
  average_speed = "average_speed",
  reference_speed = "reference_speed",
  travel_time_minutes = "travel_time_minutes",
  data_density = "data_density",
}

export type RitisDownloadRequestUuid = string;

export type NpmrdsExportDownloadPaths = {
  [RitisExportNpmrdsDataSource.ALL_VEHICLES]: string;
  [RitisExportNpmrdsDataSource.PASSENGER_VEHICLES]: string;
  [RitisExportNpmrdsDataSource.TRUCKS]: string;
};

export type NpmrdsExportDownloadMeta = {
  name: NpmrdsDownloadName;
  download_paths: NpmrdsExportDownloadPaths;
};

export type PipelineInitialEvent = {
  type: ":INITIAL";
  payload: {
    ritis_uuids: RitisDownloadRequestUuid[];
  };
  meta: {
    note: "Orchestrator for NPMRDS TravelTimeExtract Download and Transform Pipeline";
  };
};

export type IngestInitialEvent = {
  type: ":INITIAL";
  payload: {
    ritis_uuids: RitisDownloadRequestUuid[];
  };
  meta: { note: "ingest npmrds export from RITIS uuids" };
};
