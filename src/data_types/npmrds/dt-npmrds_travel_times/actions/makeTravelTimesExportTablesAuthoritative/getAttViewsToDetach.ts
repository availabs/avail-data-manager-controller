import { DateTime, Interval } from "luxon";
import _ from "lodash";

import {
  ParsedNpmrdsTravelTimesExportTableMetadata,
  EttViewsMetaSummary,
} from "./domain";

export function verifyNoEttOverlaps(ettViewsMeta: EttViewsMetaSummary) {
  const errorMessages: string[] = [];

  const { byViewId, byMonthByYearByState } = ettViewsMeta;

  const states = Object.keys(byMonthByYearByState).sort();
  for (const state of states) {
    const years = Object.keys(byMonthByYearByState[state]).sort();
    for (const year of years) {
      const months = Object.keys(byMonthByYearByState[state][year]).sort(
        (a, b) => +a - +b
      );
      for (const month of months) {
        const viewIds = byMonthByYearByState[state][year][month];

        for (let a = 0; a < viewIds.length; ++a) {
          const viewA = byViewId[viewIds[a]];

          const {
            damaViewId: a_view_id,
            start_date: a_start,
            end_date: a_end,
          } = viewA;

          const aStart = DateTime.fromISO(a_start).startOf("day");
          const aEnd = DateTime.fromISO(a_end).plus({ days: 1 }).startOf("day");

          const aIntvl = Interval.fromDateTimes(aStart, aEnd);

          for (let b = a + 1; b < viewIds.length; ++b) {
            const viewB = byViewId[viewIds[b]];

            const {
              damaViewId: b_view_id,
              start_date: b_start,
              end_date: b_end,
            } = viewB;

            const bStart = DateTime.fromISO(b_start).startOf("day");
            const bEnd = DateTime.fromISO(b_end)
              .plus({ days: 1 })
              .startOf("day");

            const bIntvl = Interval.fromDateTimes(bStart, bEnd);

            const intxn = aIntvl.intersection(bIntvl);

            if (intxn !== null) {
              const intxnStart = intxn.start.toISODate();
              const intxnEnd = intxn.end.plus({ days: -1 }).toISODate();

              errorMessages.push(
                `NpmrdsTravelTimeImports ${a_view_id} and ${b_view_id} for ${state} overlap: ${intxnStart} to ${intxnEnd}.`
              );
            }
          }
        }
      }
    }
  }

  if (errorMessages.length) {
    throw new Error(
      `INVARIANT VIOLATIONS:\n\t* ${errorMessages.join("\n\t* ")}`
    );
  }
}

export function getEttIntervalsByViewId(ettViewsMeta: EttViewsMetaSummary) {
  const ettIntervalsByViewId = ettViewsMeta.sortedByStateThenStartDate.reduce(
    (acc, viewId) => {
      const { damaViewId, start_date, end_date } =
        ettViewsMeta.byViewId[viewId];

      const dateRangeStart = DateTime.fromISO(start_date).startOf("day");
      const dateRangeEnd = DateTime.fromISO(end_date)
        .plus({ days: 1 })
        .startOf("day");

      const interval = Interval.fromDateTimes(dateRangeStart, dateRangeEnd);

      acc[damaViewId] = interval;

      return acc;
    },
    {}
  );

  return ettIntervalsByViewId;
}

export function handleHasAttViewIdsCase(
  attViewsMeta: null | EttViewsMetaSummary,
  ettViewsMeta: EttViewsMetaSummary
) {
  const ettIntervalsByViewId = getEttIntervalsByViewId(ettViewsMeta);

  const sortedEttDateRangeIntervalsByState =
    ettViewsMeta.sortedByStateThenStartDate.reduce((acc, ettViewId) => {
      const { state } = ettViewsMeta.byViewId[ettViewId];
      const interval = ettIntervalsByViewId[ettViewId];

      acc[state] = acc[state] || [];
      acc[state].push(interval);

      return acc;
    }, {});

  //  These ATTs overlap with ETTs, therefore we must
  //    * detach them from the NpmrdsTravelTimes partition tree
  //    * remove them from the new NpmrdsTravelTimes DamaView's view_dependencies
  const attViewIdsToDetachSet: Set<number> = new Set();

  // Need to collect the keeper ATTs.
  const sortedKeeperAttDateRangeIntervalsByState: Record<string, Interval[]> =
    {};

  for (const attViewId of attViewsMeta?.sortedByStateThenStartDate || []) {
    const { state, year, month, start_date, end_date } = <
      ParsedNpmrdsTravelTimesExportTableMetadata
    >attViewsMeta?.byViewId[attViewId];

    // Get the ATT's Interval
    const attDateRangeStart = DateTime.fromISO(start_date).startOf("day");

    const attDateRangeEnd = DateTime.fromISO(end_date)
      .plus({ days: 1 })
      .startOf("day");

    const attInterval = Interval.fromDateTimes(
      attDateRangeStart,
      attDateRangeEnd
    );

    // ETTs for this state/year/month
    const hasOverlappingEtts = ettViewsMeta.byMonthByYearByState[state]?.[
      year
    ]?.[month]?.some((ettId) =>
      attInterval.overlaps(ettIntervalsByViewId[ettId])
    );

    if (hasOverlappingEtts) {
      // ETTs overlap the old ATT. Need to detach the ATT before attaching the ETTs.
      console.log("\n==> HAS OVERLAPPING ETTs\n");

      attViewIdsToDetachSet.add(attViewId);
    } else {
      // No ETTs overlap the old ATT. We keep the ATT.
      sortedKeeperAttDateRangeIntervalsByState[state] =
        sortedKeeperAttDateRangeIntervalsByState[state] || [];

      sortedKeeperAttDateRangeIntervalsByState[state].push(attInterval);
    }
  }

  const states = _.uniq([
    ...Object.keys(sortedEttDateRangeIntervalsByState),
    ...Object.keys(sortedKeeperAttDateRangeIntervalsByState),
  ]).sort();

  const sortedNewAttDateRangeIntervalsByState: Record<string, Interval[]> = {};

  // Need to merge the ETTs and keeper ATTs
  for (const state of states) {
    const newAttIntervals = (sortedNewAttDateRangeIntervalsByState[state] = <
      Interval[]
    >[]);

    const attIntervals = sortedKeeperAttDateRangeIntervalsByState[state] || [];
    const ettIntervals = sortedEttDateRangeIntervalsByState[state] || [];

    let attCursor = 0;
    let ettCursor = 0;

    while (attCursor < attIntervals.length || ettCursor < ettIntervals.length) {
      const attInterval = attIntervals[attCursor];
      const ettInterval = ettIntervals[ettCursor];

      if (!attInterval) {
        newAttIntervals.push(ettInterval);
        ++ettCursor;
        continue;
      }

      if (!ettInterval) {
        newAttIntervals.push(attInterval);
        ++attCursor;
        continue;
      }

      const { start: attStartDateTime } = attInterval;
      const { start: ettStartDateTime } = ettInterval;

      const attStartDate = attStartDateTime.toISODate();
      const ettStartDate = ettStartDateTime.toISODate();

      if (attStartDate < ettStartDate) {
        newAttIntervals.push(attInterval);
        ++attCursor;
        continue;
      } else {
        newAttIntervals.push(ettInterval);
        ++ettCursor;
        continue;
      }
    }
  }

  /*
  console.log(
    JSON.stringify(
      {
        sortedKeeperAttDateRangeIntervalsByState,
        sortedEttDateRangeIntervalsByState,
        sortedNewAttDateRangeIntervalsByState,
      },
      null,
      4
    )
  );
 */

  return {
    sortedNewAttDateRangeIntervalsByState,
    attViewIdsToDetach: [...attViewIdsToDetachSet],
  };
}

export function handleNoAttViewIdsCase(ettViewsMeta: EttViewsMetaSummary) {
  const ettIntervalsByViewId = getEttIntervalsByViewId(ettViewsMeta);
  const sortedNewAttDateRangeIntervalsByState: Record<string, Interval[]> = {};

  for (const state of Object.keys(ettViewsMeta.byMonthByYearByState).sort()) {
    sortedNewAttDateRangeIntervalsByState[state] = [];

    const years = Object.keys(ettViewsMeta.byMonthByYearByState[state])
      .map((yr) => +yr)
      .sort((a, b) => a - b);

    for (const year of years) {
      const months = Object.keys(ettViewsMeta.byMonthByYearByState[state][year])
        .map((mo) => +mo)
        .sort((a, b) => a - b);

      for (const month of months) {
        const ettIntervals = ettViewsMeta.byMonthByYearByState[state][year][
          month
        ].map((ettViewId) => ettIntervalsByViewId[ettViewId]);

        sortedNewAttDateRangeIntervalsByState[state].push(...ettIntervals);
      }
    }
  }

  return {
    sortedNewAttDateRangeIntervalsByState,
    attViewIdsToDetach: <number[]>[],
  };
}

export function validateNoAttGaps(
  attViewsMeta: null | EttViewsMetaSummary,
  sortedNewAttDateRangeIntervalsByState: Record<string, Interval[]>
) {
  const errorMessages: string[] = [];

  const newAttIntervalUnionsByState: Record<string, Interval> = {};

  // TEST: No gaps within the new ATTs
  for (const state of Object.keys(
    sortedNewAttDateRangeIntervalsByState
  ).sort()) {
    const intervals = sortedNewAttDateRangeIntervalsByState[state];

    const union = <Interval>(
      _.first(intervals)?.union(<Interval>_.last(intervals))
    );

    newAttIntervalUnionsByState[state] = union;

    let [prevInterval] = intervals;

    for (const curInterval of intervals.slice(1)) {
      if (!prevInterval.abutsStart(curInterval)) {
        const preEnd = prevInterval.end.toISODate();
        const curStart = curInterval.start.toISODate();

        errorMessages.push(
          `For state ${state} there is an date gap from ${preEnd} to ${curStart}`
        );
      }

      prevInterval = curInterval;
    }
  }

  if (attViewsMeta !== null) {
    const oldAttIntervalUnionsByState: Record<string, Interval> = Object.keys(
      attViewsMeta.byMonthByYearByState
    ).reduce((acc, state) => {
      const byMonthByYear = attViewsMeta.byMonthByYearByState[state];
      const years = Object.keys(byMonthByYear).map((yr) => +yr);

      const minYear = <number>_.min(years);
      const maxYear = <number>_.max(years);

      const minMonth = <number>(
        _.min(Object.keys(byMonthByYear[minYear]).map((mo) => +mo))
      );

      const maxMonth = <number>(
        _.max(Object.keys(byMonthByYear[maxYear]).map((mo) => +mo))
      );

      const minAttViewId = <number>_.first(byMonthByYear[minYear][minMonth]);
      const maxAttViewId = <number>_.last(byMonthByYear[maxYear][maxMonth]);

      const start_date = attViewsMeta.byViewId[minAttViewId].start_date;
      const end_date = attViewsMeta.byViewId[maxAttViewId].end_date;

      const startDateTime = DateTime.fromISO(start_date);
      const endDateTime = DateTime.fromISO(end_date)
        .plus({ days: 1 })
        .startOf("day");

      const interval = Interval.fromDateTimes(startDateTime, endDateTime);

      acc[state] = interval;

      return acc;
    }, {});

    /*
    console.log(
      JSON.stringify(
        { attViewsMeta, sortedNewAttDateRangeIntervalsByState },
        null,
        4
      )
    );
    */

    const states = _.uniq([
      ...Object.keys(oldAttIntervalUnionsByState),
      ...Object.keys(newAttIntervalUnionsByState),
    ]).sort();

    for (const state of states) {
      const oldInterval = oldAttIntervalUnionsByState[state];
      const newInterval = newAttIntervalUnionsByState[state];

      if (oldInterval && !newInterval.engulfs(oldInterval)) {
        const oldStr = oldInterval.toISODate();
        const newStr = newInterval.toISODate();

        errorMessages.push(
          `For state ${state} the old interval was ${oldStr} but it is now ${newStr}`
        );
      }
    }
  }

  if (errorMessages.length) {
    throw new Error(
      `INVARIANT VIOLATIONS:\n\t* ${errorMessages.join("\n\t* ")}`
    );
  }

  const dateExtentsByState = Object.keys(newAttIntervalUnionsByState).reduce(
    (acc, state) => {
      const interval = newAttIntervalUnionsByState[state];

      const start_date = interval.start.toISODate();
      const end_date = interval.end.minus({ days: 1 }).toISODate();

      acc[state] = [start_date, end_date];

      return acc;
    },
    {}
  );

  return dateExtentsByState;
}

export default function getAttViewsToDetach(
  attViewsMeta: null | EttViewsMetaSummary,
  ettViewsMeta: EttViewsMetaSummary
) {
  verifyNoEttOverlaps(ettViewsMeta);

  const hasAttViewIds = !!attViewsMeta?.sortedByStateThenStartDate?.length;

  const { sortedNewAttDateRangeIntervalsByState, attViewIdsToDetach } =
    hasAttViewIds
      ? handleHasAttViewIdsCase(attViewsMeta, ettViewsMeta)
      : handleNoAttViewIdsCase(ettViewsMeta);

  const dateExtentsByState = validateNoAttGaps(
    attViewsMeta,
    sortedNewAttDateRangeIntervalsByState
  );

  const attViewsToDetach = attViewsMeta
    ? attViewIdsToDetach.map((attViewId) => attViewsMeta.byViewId[attViewId])
    : [];

  // FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME
  // Need to guarantee that the new ATTs cover at least as much time as the old.
  //  EG: 20220101-20220131 cannot be replaced with 20220101-20220116
  return { attViewsToDetach, dateExtentsByState };
}
