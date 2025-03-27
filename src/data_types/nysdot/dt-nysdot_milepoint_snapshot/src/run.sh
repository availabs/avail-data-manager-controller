#!/bin/bash

set -e
set -a

export AVAIL_DATA_YEAR=2019

echo "AVAIL_DATA_YEAR: ${AVAIL_DATA_YEAR}"

time node assign_lrs_milepoint_measures
time node partition_lrs_milepoint_linestrings
time node identify_source_data_integrity_issues

export AVAIL_DATA_YEAR=2020

echo "AVAIL_DATA_YEAR: ${AVAIL_DATA_YEAR}"

time node assign_lrs_milepoint_measures
time node partition_lrs_milepoint_linestrings
time node identify_source_data_integrity_issues

export AVAIL_DATA_YEAR=2021

echo "AVAIL_DATA_YEAR: ${AVAIL_DATA_YEAR}"

time node assign_lrs_milepoint_measures
time node partition_lrs_milepoint_linestrings
time node identify_source_data_integrity_issues

export AVAIL_DATA_YEAR=2022

echo "AVAIL_DATA_YEAR: ${AVAIL_DATA_YEAR}"

time node assign_lrs_milepoint_measures
time node partition_lrs_milepoint_linestrings
time node identify_source_data_integrity_issues

export AVAIL_DATA_YEAR=2023

echo "AVAIL_DATA_YEAR: ${AVAIL_DATA_YEAR}"

time node assign_lrs_milepoint_measures
time node partition_lrs_milepoint_linestrings
time node identify_source_data_integrity_issues
