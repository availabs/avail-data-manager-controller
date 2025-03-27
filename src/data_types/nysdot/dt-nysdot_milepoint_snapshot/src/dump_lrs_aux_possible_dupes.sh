#!/bin/bash

set -e

OUTFILE_NAME="${VERSION}.lrs_aux_possible_dupes.$TIMESTAMP.ndjson"
OUTFILE_PATH="$DERIVED_DATA_DIR/$OUTFILE_NAME"

rm -f $OUTFILE_PATH

psql \
  -d "$PG_CREDS" \
  -c "
    COPY (
      SELECT
          ROW_TO_JSON(t)
        FROM $DB_SCHEMA.qa_possible_lrs_aux_duplicate_data_analysis AS t
    ) TO STDOUT
  " \
> $OUTFILE_PATH

chmod -w $OUTFILE_PATH

zip -m -9 $OUTFILE_PATH.zip $OUTFILE_PATH
