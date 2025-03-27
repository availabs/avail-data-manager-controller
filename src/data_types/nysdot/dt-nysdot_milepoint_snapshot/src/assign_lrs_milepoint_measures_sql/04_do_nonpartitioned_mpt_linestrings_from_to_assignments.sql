/*
    Applying Matching Models bases on Invariants.

    HARD REQUIREMENT:
      LRS Aux features join to their corresponding LRS Milepoint linestrings using route_id and from/to.

    TEST: the lrs_aux_geom_from_mi and lrs_aux_geom_to_mi

--  An ideal set of INVARIANTs for an easy decision.
--    1. Find all the set X of all (lrs_mpt_ogc_fid, lrs_aux_table_name, lrs_aux_ogc_fid) relations where
--        (a) the milepoint feature's lrs_mpt_lstr_n = 1
--        (b) the aux feature's lrs_aux_lstr_n = 1
--        (c) the geom start and end points are equal (accomodating reversed to/from aux features)
--    2. For each relation in X,
--        if all aux from/to measures agree,
--        then use the concensus from/to.
--  These feature's linestrings do not need to be split.
*/

UPDATE :ETL_WORK_SCHEMA.lrs_milepoint_linestring_from_to_measure_assignments AS x
  SET assigned_from_measure       = y.lrs_mpt_lstr_from_mi,
      assigned_to_measure         = y.lrs_mpt_lstr_to_mi,
      measure_assignment_method   = 'lrs_milepoint_feature_has_no_aux_features'
  FROM (
    SELECT DISTINCT
        a.lrs_mpt_lstr_id,
        a.lrs_mpt_lstr_from_mi,
        a.lrs_mpt_lstr_to_mi
      FROM :ETL_WORK_SCHEMA.lrs_milepoint_linestrings AS a
        LEFT OUTER JOIN :ETL_WORK_SCHEMA.lrs_aux_geometries AS b
          USING (route_id)
      WHERE ( b.route_id IS NULL )
  ) AS y

  WHERE (
    ( x.assigned_from_measure IS NULL )
    AND
    ( x.assigned_to_measure IS NULL )
    AND
    ( x.lrs_mpt_lstr_id = y.lrs_mpt_lstr_id )
  )
;


UPDATE :ETL_WORK_SCHEMA.lrs_milepoint_linestring_from_to_measure_assignments AS x
  SET assigned_from_measure       = y.assigned_from_measure,
      assigned_to_measure         = y.assigned_to_measure,
      measure_assignment_method   = 'lrs_calibration_points_and_aux_features_consensus'
  FROM (
    SELECT
        a.lrs_mpt_lstr_id,
        MIN(a.lrs_mpt_lstr_start_pt_calib_pt_measure) AS assigned_from_measure,
        MIN(a.lrs_mpt_lstr_end_pt_calib_pt_measure) AS assigned_to_measure

      FROM :ETL_WORK_SCHEMA.lrs_mpt_lstr_join_aux_lstr_using_route_id AS a
        -- NOTE: The LEFT OUTER JOIN acts as a filter. There MUST NOT be a match from b given the ON conditions.
        LEFT OUTER JOIN :ETL_WORK_SCHEMA.lrs_mpt_lstr_join_aux_lstr_using_route_id AS b
          ON (
            -- Linestring identities
            (
              -- Same LRS Milepoint feature
              ( a.lrs_mpt_ogc_fid = b.lrs_mpt_ogc_fid )
              AND
              -- Different MultiLinestring constituent Linestring
              ( a.lrs_mpt_lstr_id != b.lrs_mpt_lstr_id ) -- Always evaluates to False if ST_NumGeometries for Mpt Linestring = 1
              AND
              -- Same Aux Linestring
              ( a.lrs_aux_lstr_id = b.lrs_aux_lstr_id )
            )

            AND

            (
              ( a.lrs_mpt_lstr_start_pt_calib_pt_measure IS NOT NULL )
              AND
              ( a.lrs_mpt_lstr_end_pt_calib_pt_measure IS NOT NULL )
            )

            AND

            (
              (
                -- Mpt linestring A is not cospatial with the Aux linestring
                ( NOT a.lrs_mpt_and_aux_lstrs_are_cospatial )
                -- Mpt linestring A's from/to overlaps the aux linestring's from/to,
                -- even though the aux linestring from/to should overlap mpt lstr B's from/to.
                -- NOTE: -- lrs_mpt_lstr_mi_exclusive_range equal for a & b since same lrs_aux_lstr_id
                AND
                (
                  a.lrs_mpt_lstr_calib_pt_measure_exclusive_range
                  &&
                  b.lrs_aux_geom_mi_exclusive_range
                )
              )
              AND
              (
                -- Mpt linestring B is cospatial with the Aux linestring
                ( b.lrs_mpt_and_aux_lstrs_are_cospatial )
                AND
                ( -- OK if the LRS Aux feature spans both. Just cannot span a and not b.
                  NOT (
                    b.lrs_mpt_lstr_calib_pt_measure_exclusive_range
                    &&
                    b.lrs_aux_geom_mi_exclusive_range
                  )
                )
              )
            )
          )
        WHERE ( b.lrs_mpt_lstr_id IS NULL ) -- The conditions of the ON clause MUST evaluate to false.

      GROUP BY 1
      HAVING (
        -- For all LRS Aux Lstrs, cospatial implies from/to measure range intersection
        ( BOOL_AND(
            ( NOT  ( a.lrs_mpt_and_aux_lstrs_are_cospatial ) )
            OR
            (
              a.lrs_mpt_lstr_calib_pt_measure_exclusive_range
              &&
              a.lrs_aux_geom_mi_exclusive_range
            )
          )
        )
      )
  ) AS y
  WHERE (
    ( x.assigned_from_measure IS NULL )
    AND
    ( x.assigned_to_measure IS NULL )
    AND
    ( x.lrs_mpt_lstr_id = y.lrs_mpt_lstr_id )
  )
;



-- Using TEMP TABLE so we can enforce a constraint of one assignment per LRS Milepoint Linestring
CREATE TEMPORARY TABLE tmp_method_05_assignments (
  lrs_mpt_lstr_id           INTEGER PRIMARY KEY,
  assigned_from_measure     DOUBLE PRECISION NOT NULL,
  assigned_to_measure       DOUBLE PRECISION NOT NULL
) ;

INSERT INTO tmp_method_05_assignments (
  lrs_mpt_lstr_id,
  assigned_from_measure,
  assigned_to_measure
)
  SELECT DISTINCT
      a.lrs_mpt_lstr_id,
      MIN(a.lrs_mpt_lstr_from_mi) AS assigned_from_measure,
      MIN(a.lrs_mpt_lstr_to_mi) AS assigned_to_measure

    FROM :ETL_WORK_SCHEMA.lrs_mpt_lstr_join_aux_lstr_using_route_id AS a
      -- NOTE: The LEFT OUTER JOIN acts as a filter. There MUST NOT be a match from b given the ON conditions.
      LEFT OUTER JOIN :ETL_WORK_SCHEMA.lrs_mpt_lstr_join_aux_lstr_using_route_id AS b
        --  The following ON condition tests the reliablity of the calculated LRS Mpt Linestring from/to measures
        --    using the from/to measure of all associated (by route_id) Aux Linestrings.
        --
        --  In short, our test of calculated LRS Mpt from/to measures to LRS Mpt Linestring from/to measures is
        --
        --      Cospatiality should imply measure overlap.
        --
        --  For a given LRS Milepoint feature Ly there MUST NOT EXIST (∄) a case where
        --    1. Lₓ's geometry is a MultiLinestring with more than one constituent Linestring
        --        a. Lₘ and Lₙ are distinct Linestrings in Lₓ's MultiLinestring geometry.
        --    2. there exists an LRS Aux Linestring Lₐ associated by route_id such that
        --        a. Lₘ and Lₐ are not cospatial but their from/to measures overlap
        --        b. Lₙ and Lₐ are cospatial but their from/to measures do not overlap
        --
        --  If there exists such a case, it would imply our calcuated LRS Mpt from/to measures are unreliable.
        --
        --  If the following ON condition evaluates to TRUE then the INVARIANT is violated
        --    and there exists in the set of associated (by route_id) lrs_aux_lstrs
        --    an LRS Aux feature with from/to measures that contradicts our
        --    calculated LRS Mpt from/to measures.
        --
        --  The following describes the logic of ON condition where if it evaluates to TRUE the INVARIANT is violated:
        --
        --    0. a.lrs_mpt_lstr != b.lrs_mpt_lstr
        --    1. a.lrs_aux_lstr == b.lrs_aux_lstr (Since equal, referred to below as the lrs_aux_lstr)
        --
        --    2. a.lrs_mpt_lstr is not cospatial with the lrs_aux_lstr
        --    3. a.lrs_mpt_lstr's from/to measures overlaps the lrs_aux_lstr's
        --
        --    4. b.lrs_mpt_lstr is cospatial with the lrs_aux_lstr
        --    5. a.lrs_mpt_lstr's from/to measures overlaps the lrs_aux_lstr's
        --
        --    Let P = ( 0 AND 1 AND 2 AND 3 AND 4 AND 5 ).
        --
        --      If P = TRUE, then the INVARIANT is violated.
        --
        --  NOTE: In the case of a two point LRS Aux Linestrings with synthetic start & end points,
        --        it may not be cospatial with any lrs_mpt_lstr. In this case 4 is FALSE making P FALSE as well.
        --
        --  If b.lrs_mpt_lstr_id IS NULL, then
        --    1. the ON condition failed,
        --    2. there does not exist a case the violates the INVARIANT
        --    3. the calcuated LRS Mpt Linestring from/to measures do not contradict any LRS Aux from/to measures
        ON (
          -- Linestring identities
          (
            -- Same LRS Milepoint feature
            ( a.lrs_mpt_ogc_fid = b.lrs_mpt_ogc_fid )
            AND
            -- Different MultiLinestring constituent Linestring
            ( a.lrs_mpt_lstr_id != b.lrs_mpt_lstr_id ) -- Always evaluates to False if ST_NumGeometries for Mpt Linestring = 1
            AND
            -- Same Aux Linestring
            ( a.lrs_aux_lstr_id = b.lrs_aux_lstr_id )
          )

          AND

          (
            (
              -- Mpt linestring A is not cospatial with the Aux linestring
              ( NOT a.lrs_mpt_and_aux_lstrs_are_cospatial )
              -- Mpt linestring A's from/to overlaps the aux linestring's from/to,
              -- even though the aux linestring from/to should overlap mpt lstr B's from/to.
              -- NOTE: -- lrs_mpt_lstr_mi_exclusive_range equal for a & b since same lrs_aux_lstr_id
              AND
              (
                a.lrs_mpt_lstr_mi_exclusive_range
                &&
                b.lrs_aux_geom_mi_exclusive_range
              )
            )
            AND
            (
              -- Mpt linestring B is cospatial with the Aux linestring
              ( b.lrs_mpt_and_aux_lstrs_are_cospatial )
              AND
              ( -- OK if the LRS Aux feature spans both. Just cannot span a and not b.
                NOT (
                  b.lrs_mpt_lstr_mi_exclusive_range
                  &&
                  b.lrs_aux_geom_mi_exclusive_range
                )
              )
            )
          )
        )
      WHERE ( b.lrs_mpt_lstr_id IS NULL ) -- The conditions of the ON clause MUST evaluate to false.

    GROUP BY 1
    HAVING (
      -- For all LRS Aux Lstrs, cospatial implies from/to measure range intersection
      ( BOOL_AND(
          ( NOT  ( a.lrs_mpt_and_aux_lstrs_are_cospatial ) )
          OR
          (
            a.lrs_mpt_lstr_mi_exclusive_range
            &&
            a.lrs_aux_geom_mi_exclusive_range
          )
        )
      )
    )
;


-- NOTE: Will fail if
UPDATE :ETL_WORK_SCHEMA.lrs_milepoint_linestring_from_to_measure_assignments AS x

  SET assigned_from_measure       = y.assigned_from_measure,
      assigned_to_measure         = y.assigned_to_measure,
      measure_assignment_method   = 'cospatial_mpt_and_aux_implies_mi_range_overlap'

  FROM tmp_method_05_assignments AS y

  WHERE (
    ( x.assigned_from_measure IS NULL )
    AND
    ( x.assigned_to_measure IS NULL )
    AND
    ( x.lrs_mpt_lstr_id = y.lrs_mpt_lstr_id )
  )
;

UPDATE :ETL_WORK_SCHEMA.lrs_milepoint_linestring_from_to_measure_assignments AS x

  SET assigned_from_measure       = y.lrs_mpt_lstr_from_mi,
      assigned_to_measure         = y.lrs_mpt_lstr_to_mi,
      measure_assignment_method   = 'lrs_milepoint_lstr_has_no_aux_features'

  FROM (
    SELECT DISTINCT
        a.lrs_mpt_lstr_id,
        MIN(a.lrs_mpt_lstr_from_mi) AS lrs_mpt_lstr_from_mi,
        MIN(a.lrs_mpt_lstr_to_mi)   AS lrs_mpt_lstr_to_mi
      FROM :ETL_WORK_SCHEMA.lrs_mpt_lstr_join_aux_lstr_using_route_id AS a
      GROUP BY 1
      HAVING (
        -- ¬∃ any aux linestrings where the exclusive mi range overlaps this lrs_mpt_lstr's mi range.
        NOT BOOL_OR (
          (
            a.lrs_mpt_lstr_mi_exclusive_range
            &&
            a.lrs_aux_geom_mi_exclusive_range
          )
        )
      )
  ) AS y

  WHERE (
    ( x.assigned_from_measure IS NULL )
    AND
    ( x.assigned_to_measure IS NULL )
    AND
    ( x.lrs_mpt_lstr_id = y.lrs_mpt_lstr_id )
  )
;


DROP VIEW IF EXISTS :ETL_WORK_SCHEMA.debug_method_05 CASCADE ;
CREATE VIEW :ETL_WORK_SCHEMA.debug_method_05
  AS
    SELECT
        b.*
      FROM :ETL_WORK_SCHEMA.lrs_mpt_lstr_join_aux_lstr_using_route_id AS a
        LEFT OUTER JOIN :ETL_WORK_SCHEMA.lrs_mpt_lstr_join_aux_lstr_using_route_id AS b
          --  There does not exist for the Milepoint feature lrs_mpt_ogc_fid
          --    a case where
          --      the LRS Mpt Linestring's calculated from/to mi
          --        ( calculated nder the assumption of MultiLinestring ordering captures spatial ordering )
          --      overlaps an LRS Aux Linestring's calculated
          --
          --
          --    an b.lrs_mpt_lstr for which
          --    a lrs_aux_lstr is cospatial yet
          -- that better matches another lrs_mpt_lstr
          --  If this ON condition evaluates to TRUE,
          --    it suggests that there is a better assignment of LRS Milepoint Linestring from/to mi.
          --  If the Aux Linestring is not cospatial with A, but is cospatial with B,
          --    then the B's Milepoint Lstring from/to mi range MUST overlap the Aux Linestring's.
          ON (
            -- Same LRS Milepoint feature
            ( a.lrs_mpt_ogc_fid = b.lrs_mpt_ogc_fid )
            AND
            -- Different MultiLinestring constituent Linestring
            ( a.lrs_mpt_lstr_id != b.lrs_mpt_lstr_id )
            AND
            -- Same Aux Linestring
            ( a.lrs_aux_lstr_id = b.lrs_aux_lstr_id )
            AND
            (
              -- Mpt linestring A is not cospatial with the Aux linestring
              ( NOT a.lrs_mpt_and_aux_lstrs_are_cospatial )
              -- Mpt linestring A's from/to overlaps the aux linestring's from/to,
              -- even though the aux linestring from/to should overlap mpt lstr B's from/to.
              AND
              (
                a.lrs_mpt_lstr_mi_exclusive_range
                &&
                b.lrs_aux_geom_mi_exclusive_range
              )
            )
            AND
            (
              -- FIXME: If lrs_aux_lstr_n = 1, then simply use the feature property from/to.
              -- Mpt linestring B is cospatial with the Aux linestring
              ( b.lrs_mpt_and_aux_lstrs_are_cospatial )
              AND
              ( -- OK if the LRS Aux feature spans both. Just cannot span a and not b.
                NOT (
                  b.lrs_mpt_lstr_mi_exclusive_range
                  &&
                  b.lrs_aux_geom_mi_exclusive_range
                )
              )
            )
          )
        WHERE ( b.lrs_mpt_lstr_id IS NOT NULL ) -- The conditions of the ON clause MUST evaluate to false.
;
