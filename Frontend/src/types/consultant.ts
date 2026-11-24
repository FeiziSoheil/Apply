export type Consultant = {
  id: string;
  name: string;
  role: string;
  countries: string[];
  bio: string;
  photo: string;
  languages: string[];
  /** Display on the public team page */
  showOnTeamPage?: boolean;
  /** Soft-active flag; inactive consultants stay for history */
  active?: boolean;
  order?: number;
};

/** @deprecated Prefer Consultant — alias for layout/team pages */
export type TeamMember = Consultant;
