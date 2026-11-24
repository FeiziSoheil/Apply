/** Central entry point of every domain's query-key factory */
import { authKeys } from "./auth/keys";
import { bookingKeys } from "./bookings/keys";
import { contentKeys } from "./content/keys";
import { leadKeys } from "./leads/keys";
import { settingsKeys } from "./settings/keys";
import { statsKeys } from "./stats/keys";
import { caseKeys, checklistKeys, documentKeys } from "./students/keys";
import { studentPanelKeys } from "./student-panel/keys";
import { ticketKeys } from "./tickets/keys";
import { userKeys } from "./users/keys";

export const queryKeys = {
  auth: authKeys,
  content: contentKeys,
  leads: leadKeys,
  bookings: bookingKeys,
  cases: caseKeys,
  documents: documentKeys,
  checklists: checklistKeys,
  tickets: ticketKeys,
  studentPanel: studentPanelKeys,
  users: userKeys,
  settings: settingsKeys,
  stats: statsKeys,
} as const;

export {
  authKeys,
  bookingKeys,
  caseKeys,
  checklistKeys,
  contentKeys,
  documentKeys,
  leadKeys,
  settingsKeys,
  statsKeys,
  studentPanelKeys,
  ticketKeys,
  userKeys,
};
