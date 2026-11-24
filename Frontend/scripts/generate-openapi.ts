import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { stringify } from "yaml";
import {
  buildOpenApiDocument,
  endpointPolicies,
} from "../src/contracts/registry";

const OUTPUT_FILE = resolve(process.cwd(), "docs", "openapi.yaml");

function main(): void {
  const document = buildOpenApiDocument();
  const yaml = stringify(document, { lineWidth: 0, aliasDuplicateObjects: false });

  mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
  writeFileSync(OUTPUT_FILE, yaml, "utf8");

  const pathCount = Object.keys(document.paths ?? {}).length;
  console.log(
    `OpenAPI written to ${OUTPUT_FILE} (${pathCount} paths, ${endpointPolicies.length} operations)`,
  );
}

main();
