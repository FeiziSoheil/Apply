import type { z } from "zod";

/**
 * Filters accepted by a list function: every contract query param is optional
 * (defaults like `page`/`pageSize` are applied by the server). Uses the
 * *output* side so booleans can be passed as real booleans.
 */
export type ListFilters<TQuerySchema extends z.ZodTypeAny> = Partial<
  z.output<TQuerySchema>
>;
