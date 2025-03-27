#!/bin/bash

set -e

SOURCE_DATA_NAME=2018-12-14_MilepointSnapshot
DB_SCHEMA=nysdot_milepoint_2018

VERSION=2019-12-19_MilepointSnapshot
DB_SCHEMA=nysdot_milepoint_2019

VERSION=2020-12-23_MilepointSnapshot
DB_SCHEMA=nysdot_milepoint_2020

VERSION=2021-12-25_MilepointSnapshot
DB_SCHEMA=nysdot_milepoint_2021

VERSION=2022-12-31_MilepointSnapshot
DB_SCHEMA=nysdot_milepoint_2022

VERSION=2023-10-28_MilepointSnapshot
DB_SCHEMA=nysdot_milepoint_2023

SOURCE_DATA_DIR=../initial_data/extracted

GDB_NAME=$SOURCE_DATA_NAME.gdb
GPKG_NAME=$SOURCE_DATA_NAME.gpkg


CREDS="host='127.0.0.1' user='dama_dev_user' dbname='dama_dev_1' password='' port=''"

# Need to CONVERT_TO_LINEAR. Does not work using the PostGIS driver.
if [ ! -f $SOURCE_DATA_DIR/$GPKG_NAME ]
then
  echo 'Creating GPKG.'

  ogr2ogr \
    -nlt CONVERT_TO_LINEAR \
    -nlt PROMOTE_TO_MULTI \
    -skipfailures \
    -t_srs EPSG:4326 \
    -F GPKG \
    $SOURCE_DATA_DIR/$GPKG_NAME \
    $SOURCE_DATA_DIR/$GDB_NAME

  chmod -w $SOURCE_DATA_DIR/$GPKG_NAME
fi

psql \
  -d "$CREDS" \
  -c "DROP SCHEMA IF EXISTS $DB_SCHEMA CASCADE;" \
  -c "CREATE SCHEMA IF NOT EXISTS $DB_SCHEMA;"

# NOTE: Added -skipfailures because of the following error
# ERROR 1: Point outside of projection domain
# ERROR 1: Point outside of projection domain
# ERROR 1: Failed to reproject feature 410245 (geometry probably out of source or destination SRS).
# ERROR 1: Terminating translation prematurely after failed
# translation of layer Calibration_Point (use -skipfailures to skip errors)

  # -doo "PRELUDE_STATEMENTS=BEGIN;" \
  # -doo CLOSING_STATEMENTS=COMMIT
ogr2ogr \
  -nlt PROMOTE_TO_MULTI \
  -F PostgreSQL PG:"$CREDS active_schema=$DB_SCHEMA"\
  $SOURCE_DATA_DIR/$GPKG_NAME \
  -lco DIM=XY \
  -lco GEOMETRY_NAME=wkb_geometry \
  -t_srs EPSG:4326 \
  -preserve_fid \
  -skipfailures \
  -lco FID=ogc_fid \
  --config PGSQL_OGR_FID ogc_fid
