CREATE SCHEMA IF NOT EXISTS transcom;

CREATE OR REPLACE VIEW transcom.transcom_events_aggregate
  AS
    SELECT
        a.event_id,
        a.event_class,
        a.reporting_organization,
        a.start_date_time,
        a.end_date_time,
        a.last_updatedate,
        a.close_date,
        a.estimated_duration_mins,
        a.event_duration,
        a.facility,
        a.event_type,
        a.lanes_total_count,
        a.lanes_affected_count,
        a.lanes_detail,
        a.lanes_status,
        a.description,
        a.direction,
        a.county,
        a.city,
        a.city_article,
        a.primary_city,
        a.secondary_city,
        a.point_lat,
        a.point_long,
        a.location_article,
        a.primary_marker,
        a.secondary_marker,
        a.primary_location,
        a.secondary_location,
        a.state,
        a.region_closed,
        a.point_datum,
        a.marker_units,
        a.marker_article,
        a.summary_description,
        a.eventstatus,
        a.is_highway,
        a.icon_file,
        a.start_incident_occured,
        a.started_at_date_time_comment,
        a.incident_reported,
        a.incident_reported_comment,
        a.incident_verified,
        a.incident_verified_comment,
        a.response_identified_and_dispatched,
        a.response_identified_and_dispatched_comment,
        a.response_arrives_on_scene,
        a.response_arrives_on_scene_comment,
        a.end_all_lanes_open_to_traffic,
        a.ended_at_date_time_comment,
        a.response_departs_scene,
        a.response_departs_scene_comment,
        a.time_to_return_to_normal_flow,
        a.time_to_return_to_normal_flow_comment,
        a.no_of_vehicle_involved,
        a.secondary_event,
        a.secondary_event_types,
        a.secondary_involvements,
        a.within_work_zone,
        a.truck_commercial_vehicle_involved,
        a.shoulder_available,
        a.injury_involved,
        a.fatality_involved,
        a.maintance_crew_involved,
        a.roadway_clearance,
        a.incident_clearance,
        a.time_to_return_to_normal_flow_duration,
        a.duration,
        a.associated_impact_ids,
        a.secondary_event_ids,
        a.is_transit,
        a.is_shoulder_lane,
        a.is_toll_lane,
        a.lanes_affected_detail,
        a.to_facility,
        a.to_state,
        a.to_direction,
        a.fatality_involved_associated_event_id,
        a.with_in_work_zone_associated_event_id,
        a.to_lat,
        a.to_lon,
        a.primary_direction,
        a.secondary_direction,
        a.is_both_direction,
        a.secondary_lanes_affected_count,
        a.secondary_lanes_detail,
        a.secondary_lanes_status,
        a.secondary_lanes_total_count,
        a.secondary_lanes_affected_detail,
        a.event_location_latitude,
        a.event_location_longitude,
        a.tripcnt,
        a.tmclist,
        a.recoverytime,
        a.year,
        a.datasource,
        a.datasourcevalue,
        a.day_of_week,
        a.tmc_geometry,

        a.tmcs_arr,
        a.event_interval,
        a.point_geom,

        b.congestion_data,

        c.display_in_incident_dashboard AS nysdot_display_in_incident_dashboard,
        c.general_category AS nysdot_general_category,
        c.sub_category AS nysdot_sub_category,
        c.detailed_category AS nysdot_detailed_category,
        c.waze_category AS nysdot_waze_category,
        c.display_if_lane_closure AS nysdot_display_if_lane_closure,
        c.duration_accurate AS nysdot_duration_accurate,

        d.state_name,
        d.state_code,
        d.region_name,
        d.region_code,
        d.county_name,
        d.county_code,
        d.mpo_name,
        d.mpo_code,
        d.ua_name,
        d.ua_code,

        a._created_timestamp,
        a._modified_timestamp

    FROM _transcom_admin.transcom_events_expanded_view AS a
      LEFT OUTER JOIN _transcom_admin.transcom_event_congestion_data AS b
        USING (event_id)
      LEFT OUTER JOIN transcom.nysdot_transcom_event_classifications AS c
        ON ( lower(a.event_type) = lower(c.event_type) )
      LEFT OUTER JOIN _transcom_admin.transcom_event_administative_geographies AS d
        USING (event_id)
;
