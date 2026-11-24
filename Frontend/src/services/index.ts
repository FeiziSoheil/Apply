export { getCountries, getCountryBySlug } from "./countries";
export {
  getUniversities,
  getUniversityBySlug,
  getUniversitiesByCountry,
} from "./universities";
export {
  getPrograms,
  getProgramBySlug,
  getSimilarPrograms,
  getProgramFields,
  getProgramIntakes,
  getProgramLanguageTypes,
  type ProgramListItem,
} from "./programs";
export {
  getServices,
  getServiceBySlug,
  getRelatedServices,
} from "./services";
export { getConsultants, getTeamMembers } from "./consultants";
export {
  getSuccessStories,
  getSuccessStoryBySlug,
} from "./success-stories";
export {
  getBlogPosts,
  getBlogPostBySlug,
  getBlogCategories,
  getFeaturedBlogPost,
  getRelatedBlogPosts,
} from "./blog";
export { getNews, getNewsBySlug, getNewsEventTypes } from "./news";
export { getCostCalculatorCountries } from "./cost-calculator";
export { getFaqs, getFaqItems, getFaqCategories } from "./faq";
export { getTestimonials } from "./testimonials";
export { getProcessSteps } from "./process";
export {
  getPricingPlans,
  getPricingComparison,
  getPricingContent,
} from "./pricing";
export { getAboutContent } from "./about";
export { getAssessmentRecommendations } from "./assessment-scoring";
export type { AssessmentRecommendation } from "./assessment-scoring";
export { getTimeSlots, type TimeSlot } from "./leads";
