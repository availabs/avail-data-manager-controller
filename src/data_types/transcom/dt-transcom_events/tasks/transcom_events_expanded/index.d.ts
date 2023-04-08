import {
  TranscomEventID,
  TranscomEventType,
  TranscomEventStatus,
  TransomEventDirection,
} from "../domain/index.d";

export * from "../domain/index.d";

export type RawTranscomEventExpanded = {
  ID: TranscomEventID;
  "Event Class": string;
  "Reporting Organization": string;
  "Start DateTime": string;
  "End DateTime": null;
  "Last Updatedate": string;
  "Close Date": string | null;
  Estimated_Duration_Mins: number;
  eventDuration: string | null;
  Facility: string;
  "Event Type": string;
  "Lanes Total Count": number | null;
  "Lanes Affected Count": number | null;
  "Lanes Detail": string | null;
  "Lanes Status": string | null;
  Description: string;
  Direction: string | null;
  County: string | null;
  City: string | null;
  "City Article": string | null;
  "Primary City": null;
  "Secondary City": string | null;
  PointLAT: number;
  PointLONG: number;
  "Location Article": string | null;
  "Primary Marker": number | null;
  "Secondary Marker": number | null;
  "Primary location": string | null;
  "Secondary location": string | null;
  State: string;
  "Region Closed": boolean;
  "Point Datum": string;
  "Marker Units": null;
  "Marker Article": string | null;
  SummaryDescription: string;
  Eventstatus: string;
  isHighway: number;
  IconFile: string;
  StartIncidentOccured: string | null;
  StartedAtDateTimeComment: null;
  IncidentReported: string | null;
  IncidentReportedComment: null;
  IncidentVerified: string | null;
  IncidentVerifiedComment: null;
  ResponseIdentifiedAndDispatched: string | null;
  ResponseIdentifiedAndDispatchedComment: null;
  ResponseArrivesonScene: string | null;
  ResponseArrivesonSceneComment: string | null;
  EndAllLanesOpenToTraffic: string | null;
  EndedAtDateTimeComment: null;
  ResponseDepartsScene: string | null;
  ResponseDepartsSceneComment: null;
  TimeToReturnToNormalFlow: string | null;
  TimeToReturnToNormalFlowComment: null;
  NoOfVehicleInvolved: string | null;
  SecondaryEvent: boolean | null;
  SecondaryEventTypes: null;
  SecondaryInvolvements: null;
  WithinWorkZone: boolean | null;
  TruckCommercialVehicleInvolved: boolean | null;
  ShoulderAvailable: boolean | null;
  InjuryInvolved: boolean | null;
  FatalityInvolved: boolean | null;
  MaintanceCrewInvolved: boolean | null;
  RoadwayClearance: string;
  IncidentClearance: string;
  TimeToReturnToNormalFlowDuration: string;
  Duration: string;
  AssociatedImpactIds: string | null;
  SecondaryEventIds: string | null;
  IsTransit: boolean;
  IsShoulderLane: boolean | null;
  IsTollLane: boolean | null;
  LanesAffectedDetail: string | null;
  ToFacility: string;
  ToState: string;
  ToDirection: string | null;
  fatalityInvolved_associatedEventID: string | null;
  withInWorkZone_associatedEventID: string | null;
  ToLat: number;
  ToLon: number;
  PrimaryDirection: string | null;
  SecondaryDirection: string | null;
  IsBothDirection: boolean;
  "Secondary Lanes Affected Count": number | null;
  "Secondary Lanes Detail": string | null;
  "Secondary Lanes Status": string | null;
  "Secondary Lanes Total Count": number | null;
  SecondaryLanesAffectedDetail: string | null;
  EventLocationLatitude: number | null;
  EventLocationLongitude: number | null;
  tripcnt: number;
  Tmclist: string | null;
  Recoverytime: number | null;
  Year: number;
  Datasource: string;
  Datasourcevalue: string;
  DayofWeek: number | null;
  tmc_geometry: string | null;
};

export type ProtoTranscomEventExpanded = {
  event_id: RawTranscomEventExpanded["ID"];
  event_class: RawTranscomEventExpanded["Event Class"];
  reporting_organization: RawTranscomEventExpanded["Reporting Organization"];
  start_date_time: RawTranscomEventExpanded["Start DateTime"];
  end_date_time: RawTranscomEventExpanded["End DateTime"];
  last_updatedate: RawTranscomEventExpanded["Last Updatedate"];
  close_date: RawTranscomEventExpanded["Close Date"];
  estimated_duration_mins: RawTranscomEventExpanded["Estimated_Duration_Mins"];
  event_duration: RawTranscomEventExpanded["eventDuration"];
  facility: RawTranscomEventExpanded["Facility"];
  event_type: RawTranscomEventExpanded["Event Type"];
  lanes_total_count: RawTranscomEventExpanded["Lanes Total Count"];
  lanes_affected_count: RawTranscomEventExpanded["Lanes Affected Count"];
  lanes_detail: RawTranscomEventExpanded["Lanes Detail"];
  lanes_status: RawTranscomEventExpanded["Lanes Status"];
  description: RawTranscomEventExpanded["Description"];
  direction: RawTranscomEventExpanded["Direction"];
  county: RawTranscomEventExpanded["County"];
  city: RawTranscomEventExpanded["City"];
  city_article: RawTranscomEventExpanded["City Article"];
  primary_city: RawTranscomEventExpanded["Primary City"];
  secondary_city: RawTranscomEventExpanded["Secondary City"];
  point_lat: RawTranscomEventExpanded["PointLAT"];
  point_long: RawTranscomEventExpanded["PointLONG"];
  location_article: RawTranscomEventExpanded["Location Article"];
  primary_marker: RawTranscomEventExpanded["Primary Marker"];
  secondary_marker: RawTranscomEventExpanded["Secondary Marker"];
  primary_location: RawTranscomEventExpanded["Primary location"];
  secondary_location: RawTranscomEventExpanded["Secondary location"];
  state: RawTranscomEventExpanded["State"];
  region_closed: RawTranscomEventExpanded["Region Closed"];
  point_datum: RawTranscomEventExpanded["Point Datum"];
  marker_units: RawTranscomEventExpanded["Marker Units"];
  marker_article: RawTranscomEventExpanded["Marker Article"];
  summary_description: RawTranscomEventExpanded["SummaryDescription"];
  eventstatus: RawTranscomEventExpanded["Eventstatus"];
  is_highway: RawTranscomEventExpanded["isHighway"];
  icon_file: RawTranscomEventExpanded["IconFile"];
  start_incident_occured: RawTranscomEventExpanded["StartIncidentOccured"];
  started_at_date_time_comment: RawTranscomEventExpanded["StartedAtDateTimeComment"];
  incident_reported: RawTranscomEventExpanded["IncidentReported"];
  incident_reported_comment: RawTranscomEventExpanded["IncidentReportedComment"];
  incident_verified: RawTranscomEventExpanded["IncidentVerified"];
  incident_verified_comment: RawTranscomEventExpanded["IncidentVerifiedComment"];
  response_identified_and_dispatched: RawTranscomEventExpanded["ResponseIdentifiedAndDispatched"];
  response_identified_and_dispatched_comment: RawTranscomEventExpanded["ResponseIdentifiedAndDispatchedComment"];
  response_arriveson_scene: RawTranscomEventExpanded["ResponseArrivesonScene"];
  response_arriveson_scene_comment: RawTranscomEventExpanded["ResponseArrivesonSceneComment"];
  end_all_lanes_open_to_traffic: RawTranscomEventExpanded["EndAllLanesOpenToTraffic"];
  ended_at_date_time_comment: RawTranscomEventExpanded["EndedAtDateTimeComment"];
  response_departs_scene: RawTranscomEventExpanded["ResponseDepartsScene"];
  response_departs_scene_comment: RawTranscomEventExpanded["ResponseDepartsSceneComment"];
  time_to_return_to_normal_flow: RawTranscomEventExpanded["TimeToReturnToNormalFlow"];
  time_to_return_to_normal_flow_comment: RawTranscomEventExpanded["TimeToReturnToNormalFlowComment"];
  no_of_vehicle_involved: RawTranscomEventExpanded["NoOfVehicleInvolved"];
  secondary_event: RawTranscomEventExpanded["SecondaryEvent"];
  secondary_event_types: RawTranscomEventExpanded["SecondaryEventTypes"];
  secondary_involvements: RawTranscomEventExpanded["SecondaryInvolvements"];
  within_work_zone: RawTranscomEventExpanded["WithinWorkZone"];
  truck_commercial_vehicle_involved: RawTranscomEventExpanded["TruckCommercialVehicleInvolved"];
  shoulder_available: RawTranscomEventExpanded["ShoulderAvailable"];
  injury_involved: RawTranscomEventExpanded["InjuryInvolved"];
  fatality_involved: RawTranscomEventExpanded["FatalityInvolved"];
  maintance_crew_involved: RawTranscomEventExpanded["MaintanceCrewInvolved"];
  roadway_clearance: RawTranscomEventExpanded["RoadwayClearance"];
  incident_clearance: RawTranscomEventExpanded["IncidentClearance"];
  time_to_return_to_normal_flow_duration: RawTranscomEventExpanded["TimeToReturnToNormalFlowDuration"];
  duration: RawTranscomEventExpanded["Duration"];
  associated_impact_ids: RawTranscomEventExpanded["AssociatedImpactIds"];
  secondary_event_ids: RawTranscomEventExpanded["SecondaryEventIds"];
  is_transit: RawTranscomEventExpanded["IsTransit"];
  is_shoulder_lane: RawTranscomEventExpanded["IsShoulderLane"];
  is_toll_lane: RawTranscomEventExpanded["IsTollLane"];
  lanes_affected_detail: RawTranscomEventExpanded["LanesAffectedDetail"];
  to_facility: RawTranscomEventExpanded["ToFacility"];
  to_state: RawTranscomEventExpanded["ToState"];
  to_direction: RawTranscomEventExpanded["ToDirection"];
  fatality_involved_associated_event_id: RawTranscomEventExpanded["fatalityInvolved_associatedEventID"];
  with_in_work_zone_associated_event_id: RawTranscomEventExpanded["withInWorkZone_associatedEventID"];
  to_lat: RawTranscomEventExpanded["ToLat"];
  to_lon: RawTranscomEventExpanded["ToLon"];
  primary_direction: RawTranscomEventExpanded["PrimaryDirection"];
  secondary_direction: RawTranscomEventExpanded["SecondaryDirection"];
  is_both_direction: RawTranscomEventExpanded["IsBothDirection"];
  secondary_lanes_affected_count: RawTranscomEventExpanded["Secondary Lanes Affected Count"];
  secondary_lanes_detail: RawTranscomEventExpanded["Secondary Lanes Detail"];
  secondary_lanes_status: RawTranscomEventExpanded["Secondary Lanes Status"];
  secondary_lanes_total_count: RawTranscomEventExpanded["Secondary Lanes Total Count"];
  secondary_lanes_affected_detail: RawTranscomEventExpanded["SecondaryLanesAffectedDetail"];
  event_location_latitude: RawTranscomEventExpanded["EventLocationLatitude"];
  event_location_longitude: RawTranscomEventExpanded["EventLocationLongitude"];
  tripcnt: RawTranscomEventExpanded["tripcnt"];
  tmclist: RawTranscomEventExpanded["Tmclist"];
  recoverytime: RawTranscomEventExpanded["Recoverytime"];
  year: RawTranscomEventExpanded["Year"];
  datasource: RawTranscomEventExpanded["Datasource"];
  datasourcevalue: RawTranscomEventExpanded["Datasourcevalue"];
  dayof_week: RawTranscomEventExpanded["DayofWeek"];
  tmc_geometry: RawTranscomEventExpanded["tmc_geometry"];
};

export type TranscomEventExpanded = {
  event_id: TranscomEventID;
  event_class: string | null;
  reporting_organization: string | null;
  start_date_time: Date | null;
  end_date_time: string | null;
  last_updatedate: Date | null;
  close_date: Date | null;
  estimated_duration_mins: number | null;
  event_duration: string | null;
  facility: string | null;
  event_type: TranscomEventType | null;
  lanes_total_count: number | null;
  lanes_affected_count: number | null;
  lanes_detail: string | null;
  lanes_status: string | null;
  description: string | null;
  direction: string | null;
  county: string | null;
  city: string | null;
  city_article: string | null;
  primary_city: string | null;
  secondary_city: string | null;
  point_lat: number | null;
  point_long: number | null;
  location_article: string | null;
  primary_marker: number | null;
  secondary_marker: number | null;
  primary_location: string | null;
  secondary_location: string | null;
  state: string | null;
  region_closed: boolean | null;
  point_datum: string | null;
  marker_units: string | null;
  marker_article: string | null;
  summary_description: string | null;
  eventstatus: string | null;
  is_highway: boolean | null;
  icon_file: string | null;
  start_incident_occured: Date | null;
  started_at_date_time_comment: string | null;
  incident_reported: Date | null;
  incident_reported_comment: string | null;
  incident_verified: Date | null;
  incident_verified_comment: string | null;
  response_identified_and_dispatched: Date | null;
  response_identified_and_dispatched_comment: string | null;
  response_arriveson_scene: Date | null;
  response_arriveson_scene_comment: string | null;
  end_all_lanes_open_to_traffic: Date | null;
  ended_at_date_time_comment: string | null;
  response_departs_scene: Date | null;
  response_departs_scene_comment: string | null;
  time_to_return_to_normal_flow: Date | null;
  time_to_return_to_normal_flow_comment: string | null;
  no_of_vehicle_involved: string | null;
  secondary_event: boolean | null;
  secondary_event_types: string | null;
  secondary_involvements: string | null;
  within_work_zone: boolean | null;
  truck_commercial_vehicle_involved: boolean | null;
  shoulder_available: boolean | null;
  injury_involved: boolean | null;
  fatality_involved: boolean | null;
  maintance_crew_involved: boolean | null;
  roadway_clearance: string | null;
  incident_clearance: string | null;
  time_to_return_to_normal_flow_duration: string | null;
  duration: string | null;
  associated_impact_ids: string | null;
  secondary_event_ids: string | null;
  is_transit: boolean | null;
  is_shoulder_lane: boolean | null;
  is_toll_lane: boolean | null;
  lanes_affected_detail: string | null;
  to_facility: string | null;
  to_state: string | null;
  to_direction: string | null;
  fatality_involved_associated_event_id: boolean | null;
  with_in_work_zone_associated_event_id: string | null;
  to_lat: number | null;
  to_lon: number | null;
  primary_direction: string | null;
  secondary_direction: string | null;
  is_both_direction: boolean | null;
  secondary_lanes_affected_count: number | null;
  secondary_lanes_detail: string | null;
  secondary_lanes_status: string | null;
  secondary_lanes_total_count: number | null;
  secondary_lanes_affected_detail: string | null;
  event_location_latitude: number | null;
  event_location_longitude: number | null;
  tripcnt: boolean | null;
  tmclist: string | null;
  recoverytime: number | null;
  year: number | null;
  datasource: boolean | null;
  datasourcevalue: string | null;
  dayof_week: number | null;
  tmc_geometry: string | null;
};