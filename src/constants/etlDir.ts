import { mkdirSync } from "fs";
import { join } from "path";

const dir = join(__dirname, "../../etl-work-dir");

mkdirSync(dir, { recursive: true });

export default dir;
