export type SuccessStory = {
  id: string;
  /** Optional slug for detail routes */
  slug?: string;
  studentName: string;
  /** When true, public UI anonymizes the student name */
  isAnonymous?: boolean;
  country: string;
  university: string;
  field: string;
  year: number;
  quote: string;
  /** Longer narrative shown in story detail dialog */
  body?: string;
  /** When set, UI shows a local video placeholder (no external embed) */
  videoUrl?: string;
  photo?: string;
  /** Consent required before publishing */
  publicationConsent?: boolean;
  order?: number;
};
