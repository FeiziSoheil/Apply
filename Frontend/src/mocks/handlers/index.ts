import type { HttpHandler } from "msw";
import { createContractHandlers, type RouteImplementations } from "../contract";
import { authHandlers } from "./auth";
import { availabilityHandlers } from "./availability";
import { bookingHandlers } from "./bookings";
import { contentHandlers } from "./content";
import { createFileServingHandlers, fileHandlers } from "./files";
import { crmHandlers } from "./crm";
import { leadHandlers } from "./leads";
import { paymentHandlers } from "./payments";
import { settingsHandlers } from "./settings";
import { statsHandlers } from "./stats";
import { studentHandlers } from "./students";
import { studentPanelHandlers } from "./student-panel";
import { ticketHandlers } from "./tickets";
import { userHandlers } from "./users";

/** Every implemented operation, keyed by contract `operationId` */
export const implementations: RouteImplementations = {
  ...authHandlers,
  ...userHandlers,
  ...settingsHandlers,
  ...contentHandlers,
  ...leadHandlers,
  ...crmHandlers,
  ...availabilityHandlers,
  ...bookingHandlers,
  ...fileHandlers,
  ...studentHandlers,
  ...studentPanelHandlers,
  ...ticketHandlers,
  ...paymentHandlers,
  ...statsHandlers,
};

/**
 * All MSW handlers: one per `src/contracts` endpoint (validated request and
 * response) plus the non-contract `GET /mock-files/*` helper.
 */
export function createHandlers(): HttpHandler[] {
  return [...createContractHandlers(implementations), ...createFileServingHandlers()];
}
