import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

/**
 * Single place where Zod is extended with `.openapi()`.
 * Every contract file must import `z` from here (not from "zod") so the
 * extension is guaranteed to be applied before any schema is defined.
 */
extendZodWithOpenApi(z);

export { z };
