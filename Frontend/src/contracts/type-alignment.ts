/**
 * Compile-time guard: every contract entity must stay assignable to the
 * corresponding frontend type in `src/types`. If a frontend type changes and
 * the contract drifts, `tsc` / `next build` fails here.
 *
 * Type-only module — never imported at runtime.
 */
import type {
  BlogPost as FrontendBlogPost,
  Consultant as FrontendConsultant,
  Country as FrontendCountry,
  Faq as FrontendFaq,
  NewsItem as FrontendNewsItem,
  Program as FrontendProgram,
  Service as FrontendService,
  SuccessStory as FrontendSuccessStory,
  University as FrontendUniversity,
} from "@/types";
import type {
  BlogPost,
  Consultant,
  Country,
  Faq,
  NewsItem,
  Program,
  Service,
  SuccessStory,
  University,
} from "./content";

type AssignableTo<Contract, Frontend> = [Contract] extends [Frontend]
  ? true
  : false;

type Assert<T extends true> = T;

export type ContractAlignment = [
  Assert<AssignableTo<Country, FrontendCountry>>,
  Assert<AssignableTo<University, FrontendUniversity>>,
  Assert<AssignableTo<Program, FrontendProgram>>,
  Assert<AssignableTo<Service, FrontendService>>,
  Assert<AssignableTo<Consultant, FrontendConsultant>>,
  Assert<AssignableTo<SuccessStory, FrontendSuccessStory>>,
  Assert<AssignableTo<BlogPost, FrontendBlogPost>>,
  Assert<AssignableTo<NewsItem, FrontendNewsItem>>,
  Assert<AssignableTo<Faq, FrontendFaq>>,
];
