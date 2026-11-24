import {
  aboutGallery,
  aboutLicenses,
  aboutMission,
  aboutStats,
  aboutStory,
  aboutTimeline,
  aboutValues,
} from "@/data/about";
import { mockDelay } from "@/lib/mock-delay";

export async function getAboutContent() {
  "use cache";
  await mockDelay();
  return {
    story: aboutStory,
    mission: aboutMission,
    values: aboutValues,
    stats: aboutStats,
    timeline: aboutTimeline,
    licenses: aboutLicenses,
    gallery: aboutGallery,
  };
}
