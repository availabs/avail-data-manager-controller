import { resolve, dirname, join } from "node:path";
import fs from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { DuckDBInstance, DuckDBConnection } from "@duckdb/node-api";
import { glob } from "glob";
import pgFormat from "pg-format";
import { getPostgresConnectionString } from "data_manager/dama_db/postgres/PostgreSQL";

import logger from "data_manager/logger";
import { getPgEnv } from "data_manager/contexts";
import getEtlWorkDir from "var/getEtlWorkDir";

// Define an interface for the structure of the metadata.json file
interface NpmrdsMetadata {
  metadata: {
    name: string;
    state: string;
  };
}

// Define an interface for the expected query result from the qa_counts table
interface QaCounts {
  raw_count: bigint;
  sqlite_count: bigint;
  postgres_count: bigint;
}

/**
 * Main function to find and process a single NPMRDS data directory.
 * @param etlWorkDir The root directory to search for NPMRDS data.
 * @param pgEnv The PostgreSQL environment identifier.
 */
export default async function main(
  etlWorkDir: string | null = getEtlWorkDir(),
  pgEnv: string | null = getPgEnv()
): Promise<void> {
  if (!(etlWorkDir && pgEnv)) {
    throw new Error("searchRoot and pgEnv are required parameters.");
  }

  // Use the imported utility to get the connection string
  const pgConnectionString = getPostgresConnectionString(pgEnv);

  const metadataFile = join(etlWorkDir, "metadata.json");

  try {
    await fs.access(metadataFile, fsConstants.F_OK);
  } catch (err) {
    logger.error("Could not access the metadata.json file.");
    throw err;
  }

  console.log(`Starting verification for ${metadataFile}...`);

  let con: DuckDBConnection | undefined;

  try {
    const dir: string = dirname(metadataFile);

    const metadataContent: string = await fs.readFile(metadataFile, "utf8");
    const metadata: NpmrdsMetadata = JSON.parse(metadataContent);
    const baseName: string | undefined = metadata?.metadata?.name;
    const state: string | undefined = metadata?.metadata?.state;

    if (!baseName || !state) {
      console.error(
        `WARN: Could not read .metadata.name or .metadata.state from ${metadataFile}. Skipping.`
      );
      return;
    }

    const dbPath: string = resolve(dir, "qa_integrity.duckdb");

    const sqliteFiles: string[] = await glob("*.sqlite3", {
      cwd: dir,
      absolute: true,
    });

    if (sqliteFiles.length === 0) {
      console.error(
        `WARN: No SQLite database found in ${dir}. Skipping comparison.`
      );
      return;
    }
    const sqlitePath: string = join(etlWorkDir, `${baseName}.sqlite3`);

    try {
      await fs.access(sqlitePath, fsConstants.F_OK);
    } catch (err) {
      logger.error("Could not access the SQLite database file.");
      throw err;
    }

    await fs.rm(dbPath, { force: true });

    const instance: DuckDBInstance = await DuckDBInstance.create(dbPath);
    con = await instance.connect();

    // 1. Install and load necessary extensions.
    await con.run("INSTALL zipfs FROM community; LOAD zipfs;");
    await con.run("INSTALL sqlite; LOAD sqlite;");
    await con.run("INSTALL postgres; LOAD postgres;");

    // 2. Create the table of unique pairs from the raw data files.
    const allVehiclesZip = `zip://${dir}/npmrds_exports/all_vehicles/${baseName}.zip/${baseName}.csv`;
    const passengerVehiclesZip = `zip://${dir}/npmrds_exports/passenger_vehicles/${baseName}.zip/${baseName}.csv`;
    const trucksZip = `zip://${dir}/npmrds_exports/trucks/${baseName}.zip/${baseName}.csv`;
    // const tmcIdCsv = `zip://${dir}/npmrds_exports/all_vehicles/${baseName}.zip/TMC_Identification.csv`;

    const createPairsTableSql = `
      CREATE TABLE unique_tmc_tstamp_pairs AS
        SELECT
            all_pairs.tmc_code,
            all_pairs.measurement_tstamp
          FROM (
              SELECT
                  tmc_code,
                  measurement_tstamp
                FROM
                  read_csv(
                    '${allVehiclesZip}',
                    header=true,
                    delim=','
                  )
                WHERE ( travel_time_seconds IS NOT NULL )
              UNION
              SELECT
                  tmc_code,
                  measurement_tstamp
                FROM
                  read_csv(
                    '${passengerVehiclesZip}',
                    header=true,
                    delim=','
                  )
                WHERE ( travel_time_seconds IS NOT NULL )
              UNION
              SELECT
                  tmc_code,
                  measurement_tstamp
                FROM
                  read_csv(
                    '${trucksZip}',
                    header=true,
                    delim=','
                  )
                WHERE ( travel_time_seconds IS NOT NULL )
            ) AS all_pairs
        --    INNER JOIN
        --      read_csv(
        --        '${tmcIdCsv}',
        --        header=true
        --    ) AS tmc_info ON ( all_pairs.tmc_code = tmc_info.tmc )
        --  WHERE ( tmc_info.state = ${pgFormat("%L", state.toUpperCase())} );
    `;

    await con.run(createPairsTableSql);

    // 3. Use pg-format to safely construct the postgres_scan subquery.
    const postgresScanSql: string = pgFormat(
      "SELECT count(*) FROM postgres_scan(%L, 'npmrds_travel_times_imports', %I)",
      pgConnectionString,
      baseName
    );

    // 4. Create the final QA counts table.
    const createCountsTableSql = `
      CREATE TABLE qa_counts AS
      SELECT
        raw_count,
        sqlite_count,
        postgres_count,
        (raw_count = sqlite_count AND sqlite_count = postgres_count) AS passes
      FROM (
        SELECT
          (SELECT COUNT(*) FROM unique_tmc_tstamp_pairs) AS raw_count,
          (SELECT COUNT(*) FROM sqlite_scan('${sqlitePath}', 'npmrds_travel_times')) AS sqlite_count,
          (${postgresScanSql}) AS postgres_count
      ) AS counts;
    `;
    await con.run(createCountsTableSql);

    // 5. Retrieve the counts for logging.
    const reader = await con.runAndReadAll(
      "SELECT raw_count, sqlite_count, postgres_count FROM qa_counts;"
    );
    const countsResult = reader.getRowObjects<QaCounts>();
    const {
      raw_count: rawCount,
      sqlite_count: sqliteCount,
      postgres_count: postgresCount,
    } = countsResult[0];

    const allMatch: boolean =
      rawCount === sqliteCount && sqliteCount === postgresCount;
    const status: string = allMatch ? "✅ OK" : "❌ MISMATCH";
    console.log(
      `Processed: ${baseName} | Status: ${status} | Raw: ${rawCount} | SQLite: ${sqliteCount} | PostgreSQL: ${postgresCount}`
    );
  } catch (err: unknown) {
    console.error(
      `\n--- ERROR processing ${metadataFile} ---\n`,
      "\n-----------------------------------\n"
    );
    throw err;
  } finally {
    // Ensure the connection is always closed, even if errors occur.
    if (con) {
      con.closeSync();
    }
    console.log("Verification complete.");
  }
}
