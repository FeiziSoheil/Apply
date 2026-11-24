import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { permissionsForRole } from "@/lib/rbac/permissions";
import { DEMO_ACCOUNTS } from "@/mocks/config";
import { getDb, resetDb } from "@/mocks/db";
import type { MockUser } from "@/mocks/types";
import { nowIso, newId } from "@/mocks/utils";
import type { ShortlistCompareItem } from "@/contracts/student-panel";
import type { PrivacyRequest } from "@/contracts/privacy";
import { bookingHandlers } from "./bookings";
import { studentPanelHandlers } from "./student-panel";

function demoStudent(): MockUser {
  const user = getDb().users.find(
    (entry) => entry.mobile === DEMO_ACCOUNTS.student.mobile,
  );
  if (!user) throw new Error("demo student missing from seed");
  return user;
}

function adminUser(): MockUser {
  const admin = getDb().users.find((entry) => entry.role === "admin");
  if (!admin) throw new Error("admin missing from seed");
  return { ...admin, permissions: permissionsForRole("admin") };
}

describe("Panel Appointments, Profile, Shortlist & Privacy", () => {
  beforeEach(() => {
    resetDb();
  });

  afterEach(() => {
    resetDb();
  });

  /* -------------------------------------------------------------------------- */
  /*  Appointments (24-hour business rule)                                      */
  /* -------------------------------------------------------------------------- */
  describe("Appointments 24-hour rule", () => {
    it("allows student cancellation when more than 24h remain", async () => {
      const student = demoStudent();
      const db = getDb();
      // Create booking 48 hours in future
      const startsAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      const endsAt = new Date(Date.now() + 49 * 60 * 60 * 1000).toISOString();
      const consultant = db.consultants.all()[0];
      const booking = db.bookings.insert({
        id: newId(),
        code: "BK-TEST48",
        status: "confirmed",
        consultationType: "online",
        consultantId: consultant.id,
        startsAt,
        endsAt,
        name: student.name,
        mobile: student.mobile ?? "09120000001",
        notes: null,
        internalNotes: null,
        userId: student.id,
        leadId: null,
        cancelledBy: null,
        cancellationReason: null,
        cancelledAt: null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });

      const res = await bookingHandlers.cancelBooking.run({
        params: { id: booking.id },
        query: undefined,
        body: { reason: "تغییر برنامه کاری" },
        user: student,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });

      expect(res.status).toBe(200);
      const updated = db.bookings.get(booking.id);
      expect(updated?.status).toBe("cancelled");
      expect(updated?.cancelledBy).toBe("customer");
      expect(updated?.cancellationReason).toBe("تغییر برنامه کاری");
    });

    it("blocks student cancellation when less than 24h remain with Persian message", async () => {
      const student = demoStudent();
      const db = getDb();
      // Create booking 2 hours in future
      const startsAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      const endsAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
      const consultant = db.consultants.all()[0];
      const booking = db.bookings.insert({
        id: newId(),
        code: "BK-TEST02",
        status: "confirmed",
        consultationType: "online",
        consultantId: consultant.id,
        startsAt,
        endsAt,
        name: student.name,
        mobile: student.mobile ?? "09120000001",
        notes: null,
        internalNotes: null,
        userId: student.id,
        leadId: null,
        cancelledBy: null,
        cancellationReason: null,
        cancelledAt: null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });

      expect(() =>
        bookingHandlers.cancelBooking.run({
          params: { id: booking.id },
          query: undefined,
          body: { reason: "کنسلی دیرهنگام" },
          user: student,
          request: new Request("http://mock.test"),
          url: new URL("http://mock.test"),
          origin: "http://mock.test",
        }),
      ).toThrow(/24 ساعت/);

      // Verify status remains confirmed
      expect(db.bookings.get(booking.id)?.status).toBe("confirmed");
    });
  });

  /* -------------------------------------------------------------------------- */
  /*  Profile (Optimistic concurrency versioning & Mobile Change)               */
  /* -------------------------------------------------------------------------- */
  describe("Student Profile & Concurrency", () => {
    it("returns profile with version number", async () => {
      const student = demoStudent();
      const res = await studentPanelHandlers.getMyProfile.run({
        params: undefined,
        query: undefined,
        body: undefined,
        user: student,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });

      const profile = res.data as { version?: number };
      expect(profile.version).toBeDefined();
      expect(typeof profile.version).toBe("number");
    });

    it("updates profile and increments version with matching version", async () => {
      const student = demoStudent();
      const db = getDb();
      const initialVersion = student.version ?? 1;

      const res = await studentPanelHandlers.updateMyProfile.run({
        params: undefined,
        query: undefined,
        body: {
          city: "شیراز",
          version: initialVersion,
        },
        user: student,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });

      expect(res.status).toBe(200);
      const updatedUser = db.users.get(student.id);
      expect(updatedUser?.city).toBe("شیراز");
      expect(updatedUser?.version).toBe(initialVersion + 1);
    });

    it("rejects update when stale version is sent (409 Conflict)", async () => {
      const student = demoStudent();
      const db = getDb();
      // advance version in DB
      db.users.update(student.id, { version: 5 });

      expect(() =>
        studentPanelHandlers.updateMyProfile.run({
          params: undefined,
          query: undefined,
          body: {
            city: "اصفهان",
            version: 1, // stale
          },
          user: student,
          request: new Request("http://mock.test"),
          url: new URL("http://mock.test"),
          origin: "http://mock.test",
        }),
      ).toThrow(/توسط شخص دیگری تغییر یافته است/);
    });

    it("changes mobile number via request and verify OTP", async () => {
      const student = demoStudent();
      const newMobile = "09359998877";

      // 1. Request OTP
      const reqRes = await studentPanelHandlers.requestMyMobileChange.run({
        params: undefined,
        query: undefined,
        body: { mobile: newMobile },
        user: student,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });
      expect(reqRes.status).toBe(200);

      // 2. Verify with mock OTP
      const verifyRes = await studentPanelHandlers.verifyMyMobileChange.run({
        params: undefined,
        query: undefined,
        body: {
          mobile: newMobile,
          code: DEMO_ACCOUNTS.student.otp,
        },
        user: student,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });

      expect(verifyRes.status).toBe(200);
      const db = getDb();
      expect(db.users.get(student.id)?.mobile).toBe(newMobile);
    });
  });

  /* -------------------------------------------------------------------------- */
  /*  Shortlist (Merge, Compare & Consultation Request)                         */
  /* -------------------------------------------------------------------------- */
  describe("Shortlist Features", () => {
    it("merges guest shortlist into user shortlist", async () => {
      const student = demoStudent();
      const db = getDb();
      const program = db.programs.all()[0];
      const university = db.universities.all()[0];

      const res = await studentPanelHandlers.mergeMyShortlist.run({
        params: undefined,
        query: undefined,
        body: {
          items: [
            { programId: program.id, countrySlug: program.countrySlug },
            { universityId: university.id, countrySlug: university.countrySlug },
          ],
        },
        user: student,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });

      expect(res.status).toBe(200);
      const shortlist = db.shortlists.get(student.id);
      expect(shortlist?.items.some((i) => i.programId === program.id)).toBe(true);
      expect(shortlist?.items.some((i) => i.universityId === university.id)).toBe(true);
    });

    it("compares shortlisted items with enriched properties", async () => {
      const student = demoStudent();
      const db = getDb();
      const program = db.programs.all()[0];

      // Add to shortlist first
      await studentPanelHandlers.putMyShortlistItem.run({
        params: undefined,
        query: undefined,
        body: { programId: program.id, countrySlug: program.countrySlug },
        user: student,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });

      const res = await studentPanelHandlers.compareMyShortlist.run({
        params: undefined,
        query: undefined,
        body: undefined,
        user: student,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });

      expect(res.status).toBe(200);
      const data = res.data as { items?: ShortlistCompareItem[] } | ShortlistCompareItem[];
      const items = Array.isArray(data) ? data : (data.items ?? []);
      const compared = items.find((i) => i.programId === program.id);
      expect(compared).toBeDefined();
      expect(compared!.title).toBe(program.nameFa);
      expect(compared!.tuition).toBe(program.tuition);
      expect(compared!.hasScholarship).toBe(program.hasScholarship);
    });

    it("creates a support ticket with shortlisted programs for consultation", async () => {
      const student = demoStudent();
      const db = getDb();
      const program1 = db.programs.all()[0];
      const program2 = db.programs.all()[1];

      const res = await studentPanelHandlers.requestShortlistConsultation.run({
        params: undefined,
        query: undefined,
        body: {
          programIds: [program1.id, program2.id],
          note: "در مورد شرایط ویزا و بورسیه راهنمایی می‌خواهم.",
        },
        user: student,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });

      expect(res.status).toBe(201);
      const { ticketId } = res.data as { ticketId: string };
      const ticket = db.tickets.get(ticketId);
      expect(ticket).toBeDefined();
      expect(ticket?.createdBy).toBe(student.id);

      // Verify messages contain the program names
      const messages = db.ticketMessages.filter((m) => m.ticketId === ticketId);
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0].body).toContain(program1.nameFa);
      expect(messages[0].body).toContain(program2.nameFa);
    });
  });

  /* -------------------------------------------------------------------------- */
  /*  Privacy Requests & Export Data                                            */
  /* -------------------------------------------------------------------------- */
  describe("Privacy Requests & Data Export", () => {
    it("creates an account deletion request and allows admin to process it", async () => {
      const student = demoStudent();
      const admin = adminUser();
      const db = getDb();

      // Student creates request
      const createRes = await studentPanelHandlers.createMyPrivacyRequest.run({
        params: undefined,
        query: undefined,
        body: {
          type: "account_deletion",
          reason: "قصد مهاجرت از مسیر دیگری دارم",
        },
        user: student,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });

      expect(createRes.status).toBe(201);
      const req = createRes.data as { id: string; status: string };
      expect(req.status).toBe("pending");

      // Admin lists requests
      const listRes = await studentPanelHandlers.listPrivacyRequests.run({
        params: undefined,
        query: { status: "pending", page: 1, pageSize: 20 },
        body: undefined,
        user: admin,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });
      const listData = listRes.data as { items?: PrivacyRequest[] } | PrivacyRequest[];
      const listItems = Array.isArray(listData) ? listData : (listData.items ?? []);
      expect(listItems.some((r) => r.id === req.id)).toBe(true);

      // Admin approves request
      const processRes = await studentPanelHandlers.processPrivacyRequest.run({
        params: { id: req.id },
        query: undefined,
        body: {
          decision: "approve",
          adminNote: "پرونده تسویه حساب شد و حساب حذف گردید",
        },
        user: admin,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });

      expect(processRes.status).toBe(200);
      const updated = db.privacyRequests.get(req.id);
      expect(updated?.status).toBe("completed");
      expect(updated?.processedBy).toBe(admin.name);

      // Verify audit logs emitted (create by student, update by admin)
      const audits = db.auditLogs.filter(
        (log) => log.entityType === "privacy_request" && log.entityId === req.id,
      );
      expect(audits.length).toBeGreaterThanOrEqual(2);
      const updateAudit = audits.find((log) => log.action === "update");
      expect(updateAudit).toBeDefined();
      expect(updateAudit?.actorId).toBe(admin.id);
    });

    it("exports complete student data packet", async () => {
      const student = demoStudent();
      const res = await studentPanelHandlers.getMyExportData.run({
        params: undefined,
        query: undefined,
        body: undefined,
        user: student,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });

      expect(res.status).toBe(200);
      const data = res.data as {
        exportedAt: string;
        profile: unknown;
        data: {
          user: { id: string };
          documents: unknown[];
          invoices: unknown[];
          installments: unknown[];
          tickets: unknown[];
          bookings: unknown[];
        };
      };
      expect(data.data.user.id).toBe(student.id);
      expect(Array.isArray(data.data.documents)).toBe(true);
      expect(Array.isArray(data.data.tickets)).toBe(true);
      expect(Array.isArray(data.data.bookings)).toBe(true);
    });
  });
});
