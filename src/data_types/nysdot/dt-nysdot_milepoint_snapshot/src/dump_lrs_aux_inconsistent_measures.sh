#!/bin/bash

set -e

OUTFILE_NAME="${VERSION}.lrs_aux_inconsistent_measures.$TIMESTAMP.csv"
OUTFILE_PATH="$DERIVED_DATA_DIR/$OUTFILE_NAME"

rm -f $OUTFILE_PATH

psql \
  -d "$PG_CREDS" \
  -c "
    COPY (
      SELECT
          *
        FROM $DB_SCHEMA.qa_lrs_aux_features_with_inconsistent_measures AS t
        WHERE ( ABS(measure_len_diff_feet) > 50)
        ORDER BY ABS(measure_len_diff_feet) DESC
    ) TO STDOUT WITH CSV HEADER
  " \
> $OUTFILE_PATH

chmod -w $OUTFILE_PATH

zip -9 -m $OUTFILE_PATH.zip $OUTFILE_PATH
