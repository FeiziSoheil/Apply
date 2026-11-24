import { testimonials } from "@/data/testimonials";
import { mockDelay } from "@/lib/mock-delay";
import type { Testimonial } from "@/types";

export async function getTestimonials(): Promise<Testimonial[]> {
  "use cache";
  await mockDelay();
  return testimonials;
}
