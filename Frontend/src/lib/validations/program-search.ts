import { z } from "zod";

export const programSearchSchema = z.object({
  country: z.string().optional(),
  degreeLevel: z
    .enum(["bachelor", "master", "phd", "language", "foundation"])
    .optional(),
  field: z.string().optional(),
});

export type ProgramSearchValues = z.infer<typeof programSearchSchema>;
