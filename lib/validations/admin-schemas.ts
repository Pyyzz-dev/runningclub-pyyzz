import { z } from "zod";

export const clubInfoSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống"),
  content: z.string().min(1, "Nội dung không được để trống"),
  image_url: z.string().url().optional().nullable(),
});

export const historySchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống"),
  content: z.string().min(1, "Nội dung không được để trống"),
  event_date: z.string().min(1, "Ngày không hợp lệ"),
  image_url: z.string().url().optional().nullable(),
  order_index: z.number().int().optional(),
});

export const trainingInputSchema = z
  .object({
    title: z.string().min(1, "Tiêu đề không được để trống"),
    description: z.string().optional().nullable(),
    location: z.string().min(1, "Địa điểm không được để trống"),
    start_time: z.string().min(1, "Thời gian bắt đầu không hợp lệ"),
    end_time: z.string().min(1, "Thời gian kết thúc không hợp lệ"),
  })
  .refine((data) => new Date(data.end_time) > new Date(data.start_time), {
    message: "Thời gian kết thúc phải sau thời gian bắt đầu",
    path: ["end_time"],
  });

export const postInputSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống"),
  content: z.string().min(1, "Nội dung không được để trống"),
  status: z.enum(["draft", "published"]),
  cover_image_url: z.string().url().optional().nullable(),
});

export type ClubInfoInput = z.infer<typeof clubInfoSchema>;
export type HistoryInput = z.infer<typeof historySchema>;
export type TrainingInput = z.infer<typeof trainingInputSchema>;
export type PostInput = z.infer<typeof postInputSchema>;
