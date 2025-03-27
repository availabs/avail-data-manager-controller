SELECT
    route_id,
    a.from_mi,
    a.to_mi,
    MAX(avgbuspercent) AS max_avg_bus_percent

  FROM nysdot_milepoint_2023_etl.paritioned_lrs_milepoint_linestrings AS a
    INNER JOIN nysdot_milepoint_2023.ev_tradas_nyscountstats AS b
      USING (route_id)
  WHERE (
    ( b.to_date IS NULL )
    AND
    (
      numrange(
        a.from_mi::NUMERIC,
        a.to_mi::NUMERIC,
        '[)'
      )
      &&
      numrange(
        LEAST(
          b.from_measure::NUMERIC,
          b.to_measure::NUMERIC
        ),
        GREATEST(
          b.from_measure::NUMERIC,
          b.to_measure::NUMERIC
        ),
        '[)'
      )
    )
  )
  GROUP BY 1,2,3
  ORDER BY 4 DESC NULLS LAST
  LIMIT 10
;
