import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Dataset } from "./types";

export const electionDataset = JSON.parse(
  readFileSync(join(process.cwd(), "data/nec/app-election-dataset-20260603.json"), "utf8")
) as Dataset;
