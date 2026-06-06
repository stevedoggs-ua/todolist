import { z } from "zod";

export const ParsedTaskSchema = z.object({
  title: z.string().trim().min(1),
  priority: z.number().int().min(1).max(4),
  duration_min: z.number().int().positive().nullable().default(null),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
  due_time: z.string().regex(/^\d{2}:\d{2}$/).nullable().default(null),
});

export type ParsedTask = z.infer<typeof ParsedTaskSchema>;

export const ParsedTaskArraySchema = z.array(ParsedTaskSchema);
