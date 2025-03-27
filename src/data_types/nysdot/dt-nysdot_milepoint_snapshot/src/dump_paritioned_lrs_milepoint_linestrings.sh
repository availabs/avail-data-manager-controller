#!/bin/bash

set -e

GPKG_NAME="${VERSION}.basemap.$TIMESTAMP.gpkg"

GPKG_PATH="${DERIVED_DATA_DIR}/${GPKG_NAME}"

rm -f $GPKG_PATH

ogr2ogr \
  -F GPKG "$GPKG_PATH" \
  PG:"$PG_CREDS" \
  "$DB_SCHEMA.paritioned_lrs_milepoint_linestrings"

chmod -w "$GPKG_PATH"

zip -m -9 $GPKG_PATH.zip $GPKG_PATH
