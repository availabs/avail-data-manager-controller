#!/bin/bash

set -e
set -a

source .secrets

export TIMESTAMP="$(date +%Y%m%dT%H%M%S)"

export DERIVED_DATA_DIR=../derived_data
mkdir -p $DERIVED_DATA_DIR

export VERSION=2019-12-19_MilepointSnapshot
export DB_SCHEMA=nysdot_milepoint_2019_etl

./dump_paritioned_lrs_milepoint_linestrings.sh
./dump_lrs_aux_inconsistent_measures.sh
./dump_lrs_aux_possible_dupes.sh

export VERSION=2020-12-23_MilepointSnapshot
export DB_SCHEMA=nysdot_milepoint_2020_etl

./dump_paritioned_lrs_milepoint_linestrings.sh
./dump_lrs_aux_inconsistent_measures.sh
./dump_lrs_aux_possible_dupes.sh

export VERSION=2021-12-25_MilepointSnapshot
export DB_SCHEMA=nysdot_milepoint_2021_etl

./dump_paritioned_lrs_milepoint_linestrings.sh
./dump_lrs_aux_inconsistent_measures.sh
./dump_lrs_aux_possible_dupes.sh

export VERSION=2022-12-31_MilepointSnapshot
export DB_SCHEMA=nysdot_milepoint_2022_etl

./dump_paritioned_lrs_milepoint_linestrings.sh
./dump_lrs_aux_inconsistent_measures.sh
./dump_lrs_aux_possible_dupes.sh

export VERSION=2023-10-28_MilepointSnapshot
export DB_SCHEMA=nysdot_milepoint_2023_etl

./dump_paritioned_lrs_milepoint_linestrings.sh
./dump_lrs_aux_inconsistent_measures.sh
./dump_lrs_aux_possible_dupes.sh
