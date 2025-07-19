#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-var-requires */

// Register ts-node to allow direct execution of TypeScript files
require("ts-node").register();
require("tsconfig-paths").register();

const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

// Import modules using the same pattern as the example run.js
const dama_db = require("data_manager/dama_db").default;
const dama_contexts = require("data_manager/contexts");
const logger = require("data_manager/logger").default;

// Import the main function from your TypeScript verifier script
const main = require("./qa_import_completeness").default;

// Set up command-line argument parsing using yargs
const { pg_env, etl_context_id, logging_level } = yargs(hideBin(process.argv))
  .strict()
  .options({
    pg_env: {
      alias: "p",
      describe: "The PostgreSQL Database environment",
      demandOption: true,
    },
    etl_context_id: {
      alias: "e",
      describe: "The ETL Context ID to get the working directory for",
      type: "number",
      demandOption: true,
    },
    logging_level: {
      alias: "l",
      describe: "The logging level",
      demandOption: false,
      default: "info",
      choices: ["error", "warn", "info", "debug", "silly"],
    },
  }).argv;

logger.level = logging_level;

async function run() {
  try {
    logger.info(`==> Using etl_context_id: ${etl_context_id}`);

    // Create a minimal context object required by runInDamaContext
    const task_etl_context = {
      meta: { pgEnv: pg_env, etl_context_id },
    };

    // Get the ETL working directory using the provided context
    await dama_contexts.runInDamaContext(task_etl_context, main);

    logger.info("==> Data verification process finished.");
  } catch (err) {
    console.error("An unexpected error occurred in the runner:", err);
  } finally {
    // Ensure database connections are closed
    await dama_db.shutdown();
    console.log("Runner finished.");
    process.exit();
  }
}

run();
