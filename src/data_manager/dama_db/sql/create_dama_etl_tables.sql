CREATE TABLE IF NOT EXISTS _data_manager_admin.etl_context (
  context_id        SERIAL PRIMARY KEY,
  parent_id         INTEGER,

  FOREIGN KEY (parent_id) REFERENCES _data_manager_admin.etl_context(context_id)
) ;

CREATE TABLE IF NOT EXISTS _data_manager_admin.dama_event_store (
  event_id          SERIAL PRIMARY KEY,
  etl_context_id    INTEGER NOT NULL,

  type              TEXT NOT NULL,
  payload           JSONB,
  meta              JSONB,
  error             BOOLEAN,
  timestamp         TIMESTAMP NOT NULL DEFAULT NOW()
) ;

CREATE INDEX IF NOT EXISTS dama_event_store_etl_ctx_idx
  ON _data_manager_admin.dama_event_store (etl_context_id)
;

-- For querying active etl_context_ids for an ETL Task
--
--      SELECT DISTINCT
--          etl_context_id
--        FROM dama_event_store
--        WHERE ( type LIKE 'FOO/%' )
--      EXCLUDE
--      SELECT DISTINCT
--          etl_context_id
--        FROM dama_event_store
--        WHERE ( right(type, 6) = ':FINAL' )
--
-- For querying the FINAL event for an ETL Task to get the DoneData
--
--      SELECT
--          *
--        FROM dama_event_store
--        WHERE (
--          ( type LIKE 'FOO/%' )
--          AND
--          ( right(type, 6) = ':FINAL' )
--        )

CREATE INDEX IF NOT EXISTS dama_event_store_search_open_idx
  ON _data_manager_admin.dama_event_store (
    type text_pattern_ops,
    right(type, 6),
    etl_context_id
  )
;

-- For querying the FINAL event for an ETL Context to get the DoneData
--
--      SELECT
--          *
--        FROM dama_event_store
--        WHERE (
--          ( etl_context = ? )
--          AND
--          ( right(type, 6) = ':FINAL' )
--        )
CREATE INDEX IF NOT EXISTS dama_event_store_search_done_data_idx
  ON _data_manager_admin.dama_event_store (
    etl_context_id
  )
  WHERE (
    ( right(type, 6) = ':FINAL' )
    OR
    ( right(type, 6) = ':ERROR' )
  )
;
