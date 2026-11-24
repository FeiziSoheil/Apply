import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getDb, resetDb } from "@/mocks/db";
import { MockApiError } from "@/mocks/errors";
import type { MockUser } from "@/mocks/types";
import { newId, nowIso } from "@/mocks/utils";
import { authHandlers } from "./auth";
import { emptyStages } from "@/mocks/domain/cases";
import { fileHandlers, createFileServingHandlers, resetUploadRateLimits, signMockFileUrl } from "./files";
import { studentPanelHandlers } from "./student-panel";
import { ticketHandlers } from "./tickets";

function ctx(user: MockUser | null, requestInit?: RequestInit) {
  const req = new Request("http://mock.test", requestInit);
  return {
    params: undefined as unknown as { id: string },
    query: undefined as unknown,
    body: undefined as unknown,
    user,
    request: req,
    url: new URL("http://mock.test"),
    origin: "http://mock.test",
  };
}

describe("Student isolation & security", () => {
  let studentA: MockUser;
  let studentB: MockUser;
  let caseAId: string;
  let caseBId: string;
  let docAId: string;
  let docBId: string;
  let fileAId: string;
  let fileBId: string;
  let ticketAId: string;
  let ticketBId: string;
  let installmentAId: string;
  let installmentBId: string;
  let invoiceAId: string;
  let invoiceBId: string;
  let paymentAttemptAId: string;
  let paymentAttemptBId: string;

  beforeEach(() => {
    resetDb();
    resetUploadRateLimits();
    const db = getDb();
    const now = nowIso();

    // Create Student A
    studentA = db.users.insert({
      id: "student-a-" + newId(),
      name: "دانشجو الف",
      role: "student",
      permissions: [],
      mobile: "09121111111",
      status: "active",
      lastLoginAt: null,
      onboardingCompleted: true,
      createdAt: now,
      updatedAt: now,
      education: { highestDegree: null, fieldOfStudy: null, gpa: null, universityName: null },
      activeCaseId: null,
      version: 1,
    });

    // Create Student B
    studentB = db.users.insert({
      id: "student-b-" + newId(),
      name: "دانشجو ب",
      role: "student",
      permissions: [],
      mobile: "09122222222",
      status: "active",
      lastLoginAt: null,
      onboardingCompleted: true,
      createdAt: now,
      updatedAt: now,
      education: { highestDegree: null, fieldOfStudy: null, gpa: null, universityName: null },
      activeCaseId: null,
      version: 1,
    });

    // Case A
    caseAId = "case-a-" + newId();
    const caseA = db.cases.insert({
      id: caseAId,
      code: "CAS-A-01",
      leadId: null,
      status: "active",
      studentId: studentA.id,
      studentName: studentA.name,
      currentStage: "documents",
      targetCountry: "germany",
      targetDegree: "master",
      consultantId: "consultant-1",
      programIds: [],
      stages: emptyStages(),
      stageHistory: [{ stageKey: "documents", enteredAt: now, exitedAt: null, actorId: "consultant-1", note: null }],
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
    db.users.update(studentA.id, { activeCaseId: caseA.id });
    studentA.activeCaseId = caseA.id;

    // Case B
    caseBId = "case-b-" + newId();
    const caseB = db.cases.insert({
      id: caseBId,
      code: "CAS-B-02",
      leadId: null,
      status: "active",
      studentId: studentB.id,
      studentName: studentB.name,
      currentStage: "documents",
      targetCountry: "italy",
      targetDegree: "bachelor",
      consultantId: "consultant-2",
      programIds: [],
      stages: emptyStages(),
      stageHistory: [{ stageKey: "documents", enteredAt: now, exitedAt: null, actorId: "consultant-2", note: null }],
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
    db.users.update(studentB.id, { activeCaseId: caseB.id });
    studentB.activeCaseId = caseB.id;

    // Files
    fileAId = "file-a-" + newId();
    db.files.insert({
      id: fileAId,
      name: `${fileAId}.jpg`,
      url: `http://mock.test/mock-files/${fileAId}/${fileAId}.jpg`,
      size: 1024,
      mimeType: "image/jpeg",
      ownerId: studentA.id,
      createdAt: now,
    });

    fileBId = "file-b-" + newId();
    db.files.insert({
      id: fileBId,
      name: `${fileBId}.jpg`,
      url: `http://mock.test/mock-files/${fileBId}/${fileBId}.jpg`,
      size: 2048,
      mimeType: "image/jpeg",
      ownerId: studentB.id,
      createdAt: now,
    });

    // Documents
    docAId = "doc-a-" + newId();
    db.documents.insert({
      id: docAId,
      caseId: caseAId,
      type: "passport",
      title: "گذرنامه الف",
      status: "uploaded",
      custom: false,
      rejectionReason: null,
      fileId: fileAId,
      fileUrl: `http://mock.test/mock-files/${fileAId}/${fileAId}.jpg`,
      uploadedBy: studentA.id,
      reviewedBy: null,
      reviewedAt: null,
      version: 1,
      versions: [],
      createdAt: now,
      updatedAt: now,
    });

    docBId = "doc-b-" + newId();
    db.documents.insert({
      id: docBId,
      caseId: caseBId,
      type: "passport",
      title: "گذرنامه ب",
      status: "uploaded",
      custom: false,
      rejectionReason: null,
      fileId: fileBId,
      fileUrl: `http://mock.test/mock-files/${fileBId}/${fileBId}.jpg`,
      uploadedBy: studentB.id,
      reviewedBy: null,
      reviewedAt: null,
      version: 1,
      versions: [],
      createdAt: now,
      updatedAt: now,
    });

    // Tickets
    ticketAId = "ticket-a-" + newId();
    db.tickets.insert({
      id: ticketAId,
      code: "TK-A01",
      subject: "تیکت الف",
      category: "apply",
      priority: "normal",
      status: "open",
      createdBy: studentA.id,
      createdByName: studentA.name,
      assignedTo: "consultant-1",
      caseId: caseAId,
      relatedCaseId: caseAId,
      messageCount: 1,
      lastMessageAt: now,
      closedAt: null,
      firstResponseAt: null,
      slaDueAt: null,
      rating: null,
      ratingComment: null,
      createdAt: now,
      updatedAt: now,
    });
    db.ticketMessages.insert({
      id: "msg-a-" + newId(),
      ticketId: ticketAId,
      authorId: studentA.id,
      authorName: studentA.name,
      authorRole: null,
      authorType: "student",
      body: "پیام دانشجو الف",
      attachments: [],
      internal: false,
      readAt: null,
      createdAt: now,
    });

    ticketBId = "ticket-b-" + newId();
    db.tickets.insert({
      id: ticketBId,
      code: "TK-B02",
      subject: "تیکت ب",
      category: "payment",
      priority: "normal",
      status: "open",
      createdBy: studentB.id,
      createdByName: studentB.name,
      assignedTo: "consultant-2",
      caseId: caseBId,
      relatedCaseId: caseBId,
      messageCount: 1,
      lastMessageAt: now,
      closedAt: null,
      firstResponseAt: null,
      slaDueAt: null,
      rating: null,
      ratingComment: null,
      createdAt: now,
      updatedAt: now,
    });
    db.ticketMessages.insert({
      id: "msg-b-" + newId(),
      ticketId: ticketBId,
      authorId: studentB.id,
      authorName: studentB.name,
      authorRole: null,
      authorType: "student",
      body: "پیام محرمانه دانشجو ب",
      attachments: [],
      internal: false,
      readAt: null,
      createdAt: now,
    });

    // Invoices and Installments
    invoiceAId = "inv-a-" + newId();
    db.invoices.insert({
      id: invoiceAId,
      number: "INV-A-1",
      studentId: studentA.id,
      caseId: caseAId,
      title: "صورتحساب الف",
      description: null,
      subtotal: 10_000_000,
      discount: 0,
      tax: 0,
      total: 10_000_000,
      paidAmount: 0,
      currency: "IRR",
      status: "pending",
      dueDate: null,
      paidAt: null,
      items: [{ title: "خدمات", quantity: 1, unitAmount: 10_000_000, amount: 10_000_000 }],
      issuedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    installmentAId = "inst-a-" + newId();
    db.installments.insert({
      id: installmentAId,
      invoiceId: invoiceAId,
      paymentPlanId: null,
      title: "قسط ۱ الف",
      amount: 10_000_000,
      dueDate: "2026-11-01",
      paidAt: null,
      paymentMethod: null,
      paymentRef: null,
      status: "pending",
      sequence: 1,
      createdAt: now,
      updatedAt: now,
    });

    paymentAttemptAId = "pay-a-" + newId();
    db.paymentAttempts.insert({
      id: paymentAttemptAId,
      installmentId: installmentAId,
      caseId: caseAId,
      studentId: studentA.id,
      method: "gateway",
      status: "initiated",
      gatewayRef: "GW-A1",
      receiptFileId: null,
      amount: 10_000_000,
      createdAt: now,
      updatedAt: now,
    });

    invoiceBId = "inv-b-" + newId();
    db.invoices.insert({
      id: invoiceBId,
      number: "INV-B-2",
      studentId: studentB.id,
      caseId: caseBId,
      title: "صورتحساب ب",
      description: null,
      subtotal: 20_000_000,
      discount: 0,
      tax: 0,
      total: 20_000_000,
      paidAmount: 0,
      currency: "IRR",
      status: "pending",
      dueDate: null,
      paidAt: null,
      items: [{ title: "خدمات", quantity: 1, unitAmount: 20_000_000, amount: 20_000_000 }],
      issuedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    installmentBId = "inst-b-" + newId();
    db.installments.insert({
      id: installmentBId,
      invoiceId: invoiceBId,
      paymentPlanId: null,
      title: "قسط ۱ ب",
      amount: 20_000_000,
      dueDate: "2026-11-05",
      paidAt: null,
      paymentMethod: null,
      paymentRef: null,
      status: "pending",
      sequence: 1,
      createdAt: now,
      updatedAt: now,
    });

    paymentAttemptBId = "pay-b-" + newId();
    db.paymentAttempts.insert({
      id: paymentAttemptBId,
      installmentId: installmentBId,
      caseId: caseBId,
      studentId: studentB.id,
      method: "gateway",
      status: "initiated",
      gatewayRef: "GW-B2",
      receiptFileId: null,
      amount: 20_000_000,
      createdAt: now,
      updatedAt: now,
    });

    // Shortlists
    db.shortlists.insert({
      id: studentA.id,
      items: [{ id: "short-a", countrySlug: "germany", universityId: null, programId: null, addedAt: now }],
      updatedAt: now,
    });
    db.shortlists.insert({
      id: studentB.id,
      items: [{ id: "short-b", countrySlug: "italy", universityId: null, programId: null, addedAt: now }],
      updatedAt: now,
    });
  });

  afterEach(() => {
    resetDb();
  });

  /* -------------------------------------------------------------------------- */
  /*  1. Isolation: Student A accessing Student B resources returns 404         */
  /* -------------------------------------------------------------------------- */

  it("Student A accessing Student B case returns 404 (not 403)", async () => {
    try {
      await studentPanelHandlers.selectMyCase.run({
        ...ctx(studentA),
        body: { caseId: caseBId },
      });
      expect.unreachable("Expected 404");
    } catch (error) {
      expect(error).toBeInstanceOf(MockApiError);
      expect((error as MockApiError).status).toBe(404);
      expect((error as MockApiError).code).toBe("NOT_FOUND");
    }
  });

  it("Student A accessing Student B document returns 404 (not 403)", async () => {
    try {
      await studentPanelHandlers.getMyDocumentView.run({
        ...ctx(studentA),
        params: { id: docBId },
      });
      expect.unreachable("Expected 404");
    } catch (error) {
      expect(error).toBeInstanceOf(MockApiError);
      expect((error as MockApiError).status).toBe(404);
      expect((error as MockApiError).code).toBe("NOT_FOUND");
    }
  });

  it("Student A uploading for Student B document or using B's file returns 404", async () => {
    // 1) Trying to upload into B's document
    try {
      await studentPanelHandlers.uploadMyDocument.run({
        ...ctx(studentA),
        body: { documentId: docBId, fileId: fileAId },
      });
      expect.unreachable("Expected 404");
    } catch (error) {
      expect(error).toBeInstanceOf(MockApiError);
      expect((error as MockApiError).status).toBe(404);
    }

    // 2) Trying to use B's file in A's document
    try {
      await studentPanelHandlers.uploadMyDocument.run({
        ...ctx(studentA),
        body: { documentId: docAId, fileId: fileBId },
      });
      expect.unreachable("Expected 404");
    } catch (error) {
      expect(error).toBeInstanceOf(MockApiError);
      expect((error as MockApiError).status).toBe(404);
    }
  });

  it("Student A accessing Student B ticket returns 404 (not 403)", async () => {
    // getMyTicket
    try {
      await studentPanelHandlers.getMyTicket.run({
        ...ctx(studentA),
        params: { id: ticketBId },
      });
      expect.unreachable("Expected 404");
    } catch (error) {
      expect(error).toBeInstanceOf(MockApiError);
      expect((error as MockApiError).status).toBe(404);
    }

    // createMyTicketMessage on B's ticket
    try {
      await studentPanelHandlers.createMyTicketMessage.run({
        ...ctx(studentA),
        params: { id: ticketBId },
        body: { body: "تلاش غیرمجاز", attachmentIds: [] },
      });
      expect.unreachable("Expected 404");
    } catch (error) {
      expect(error).toBeInstanceOf(MockApiError);
      expect((error as MockApiError).status).toBe(404);
    }

    // closeMyTicket on B's ticket
    try {
      await studentPanelHandlers.closeMyTicket.run({
        ...ctx(studentA),
        params: { id: ticketBId },
      });
      expect.unreachable("Expected 404");
    } catch (error) {
      expect(error).toBeInstanceOf(MockApiError);
      expect((error as MockApiError).status).toBe(404);
    }
  });

  it("Student A accessing Student B payment, installment, and invoice returns 404", async () => {
    // payMyInstallment for B's installment
    try {
      await studentPanelHandlers.payMyInstallment.run({
        ...ctx(studentA),
        params: { id: installmentBId },
        body: { method: "gateway", callbackUrl: "http://mock.test/callback" },
      });
      expect.unreachable("Expected 404");
    } catch (error) {
      expect(error).toBeInstanceOf(MockApiError);
      expect((error as MockApiError).status).toBe(404);
    }

    // card_to_card using B's file on a payable installment
    const installmentA2Id = "inst-a2-" + newId();
    getDb().installments.insert({
      id: installmentA2Id,
      invoiceId: invoiceAId,
      paymentPlanId: null,
      title: "قسط ۲ الف",
      amount: 5_000_000,
      dueDate: "2026-12-01",
      paidAt: null,
      paymentMethod: null,
      paymentRef: null,
      status: "pending",
      sequence: 2,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    try {
      await studentPanelHandlers.payMyInstallment.run({
        ...ctx(studentA),
        params: { id: installmentA2Id },
        body: { method: "card_to_card", receiptFileId: fileBId },
      });
      expect.unreachable("Expected 404");
    } catch (error) {
      expect(error).toBeInstanceOf(MockApiError);
      expect((error as MockApiError).status).toBe(404);
    }

    // getMyPayment for B's payment attempt
    try {
      await studentPanelHandlers.getMyPayment.run({
        ...ctx(studentA),
        params: { id: paymentAttemptBId },
      });
      expect.unreachable("Expected 404");
    } catch (error) {
      expect(error).toBeInstanceOf(MockApiError);
      expect((error as MockApiError).status).toBe(404);
    }

    // getMyInvoice for B's invoice
    try {
      await studentPanelHandlers.getMyInvoice.run({
        ...ctx(studentA),
        params: { id: invoiceBId },
      });
      expect.unreachable("Expected 404");
    } catch (error) {
      expect(error).toBeInstanceOf(MockApiError);
      expect((error as MockApiError).status).toBe(404);
    }
  });

  it("Student A cannot access Student B signed mock file", async () => {
    const fileServing = createFileServingHandlers()[0];
    const exp = Date.now() + 15 * 60 * 1000;
    const sigB = signMockFileUrl(fileBId, studentB.id, exp);

    // 1) Student A uses B's exact signed URL (has uid=studentB)
    const reqWithUidB = new Request(
      `http://mock.test/mock-files/${fileBId}/${fileBId}.jpg?exp=${exp}&uid=${studentB.id}&sig=${sigB}`,
    );
    // Student A tries to forge their own uid on B's file
    const sigFake = signMockFileUrl(fileBId, studentA.id, exp);
    const reqWithUidA = new Request(
      `http://mock.test/mock-files/${fileBId}/${fileBId}.jpg?exp=${exp}&uid=${studentA.id}&sig=${sigFake}`,
    );

    // B accessing own file with valid sig -> 200
    const resB = await (fileServing as any).run({
      request: reqWithUidB,
      params: { id: fileBId, name: `${fileBId}.jpg` },
      cookies: {},
    });
    expect(resB?.response?.status).toBe(200);

    // A requesting B's file with uid=studentA -> 404
    const resA = await (fileServing as any).run({
      request: reqWithUidA,
      params: { id: fileBId, name: `${fileBId}.jpg` },
      cookies: {},
    });
    expect(resA?.response?.status).toBe(404);

    // Expired link -> 410
    const pastExp = Date.now() - 1000;
    const sigExpired = signMockFileUrl(fileBId, studentB.id, pastExp);
    const reqExpired = new Request(
      `http://mock.test/mock-files/${fileBId}/${fileBId}.jpg?exp=${pastExp}&uid=${studentB.id}&sig=${sigExpired}`,
    );
    const resExpired = await (fileServing as any).run({
      request: reqExpired,
      params: { id: fileBId, name: `${fileBId}.jpg` },
      cookies: {},
    });
    expect(resExpired?.response?.status).toBe(410);
  });

  it("Student A and Student B shortlists are completely isolated", async () => {
    const resA = await studentPanelHandlers.getMyShortlist.run(ctx(studentA));
    const dataA = resA.data as { items: { countrySlug: string }[] };
    expect(dataA.items).toHaveLength(1);
    expect(dataA.items[0].countrySlug).toBe("germany");

    const resB = await studentPanelHandlers.getMyShortlist.run(ctx(studentB));
    const dataB = resB.data as { items: { countrySlug: string }[] };
    expect(dataB.items).toHaveLength(1);
    expect(dataB.items[0].countrySlug).toBe("italy");
  });

  /* -------------------------------------------------------------------------- */
  /*  2. Snapshot of all Student view keys: No staff-only internal fields      */
  /* -------------------------------------------------------------------------- */

  it("snapshots keys of all Student views and ensures no staff fields exist", async () => {
    const FORBIDDEN_STAFF_FIELDS = [
      "leadValue",
      "internalNote",
      "internalNotes",
      "auditLog",
      "systemMeta",
      "rawQuery",
      "cost",
      "margin",
      "commission",
      "staffReview",
      "rejectionInternal",
      "internal",
      "authorRole",
    ];

    // 1) StudentCaseView
    const caseViewRes = await studentPanelHandlers.getMyCaseView.run(ctx(studentA));
    const caseView = caseViewRes.data as Record<string, unknown>;
    const caseKeys = Object.keys(caseView).sort();
    expect(caseKeys).toMatchInlineSnapshot(`
      [
        "advisor",
        "code",
        "currentStageKey",
        "currentStageTitle",
        "deadlines",
        "id",
        "lastUpdated",
        "nextStepHint",
        "progressPercent",
        "recentUpdates",
        "stageHistory",
        "stages",
        "targetCountry",
        "targetDegree",
        "targetProgram",
      ]
    `);
    for (const key of caseKeys) {
      expect(FORBIDDEN_STAFF_FIELDS).not.toContain(key);
    }

    // 2) DocumentView
    const docViewRes = await studentPanelHandlers.getMyDocumentView.run({
      ...ctx(studentA),
      params: { id: docAId },
    });
    const docView = docViewRes.data as Record<string, unknown>;
    const docKeys = Object.keys(docView).sort();
    expect(docKeys).toMatchInlineSnapshot(`
      [
        "canReplace",
        "checklistItemId",
        "file",
        "id",
        "locked",
        "prepFormats",
        "prepGuide",
        "prepMaxSizeBytes",
        "prepSampleHint",
        "rejectionReason",
        "required",
        "reviewedAt",
        "stageGroup",
        "stageKey",
        "stageTitle",
        "status",
        "title",
        "type",
        "updatedAt",
        "versions",
      ]
    `);
    for (const key of docKeys) {
      expect(FORBIDDEN_STAFF_FIELDS).not.toContain(key);
    }

    // 3) TicketView and TicketMessageView
    const ticketRes = await studentPanelHandlers.getMyTicket.run({
      ...ctx(studentA),
      params: { id: ticketAId },
    });
    const ticketPayload = ticketRes.data as {
      ticket: Record<string, unknown>;
      messages: Record<string, unknown>[];
    };
    const ticketKeys = Object.keys(ticketPayload.ticket).sort();
    expect(ticketKeys).toMatchInlineSnapshot(`
      [
        "assignedTo",
        "caseId",
        "category",
        "closedAt",
        "code",
        "createdAt",
        "createdBy",
        "createdByName",
        "firstResponseAt",
        "id",
        "lastMessageAt",
        "lastMessagePreview",
        "messageCount",
        "priority",
        "rating",
        "ratingComment",
        "relatedCaseId",
        "slaDueAt",
        "status",
        "subject",
        "unreadCount",
        "updatedAt",
      ]
    `);
    const messageKeys = Object.keys(ticketPayload.messages[0]).sort();
    expect(messageKeys).toMatchInlineSnapshot(`
      [
        "attachmentIds",
        "attachments",
        "authorId",
        "authorName",
        "authorType",
        "body",
        "createdAt",
        "id",
        "readAt",
        "ticketId",
      ]
    `);
    for (const key of messageKeys) {
      expect(FORBIDDEN_STAFF_FIELDS).not.toContain(key);
    }

    // 4) StudentProfile
    const profileRes = await studentPanelHandlers.getMyProfile.run(ctx(studentA));
    const profile = profileRes.data as Record<string, unknown>;
    const profileKeys = Object.keys(profile).sort();
    expect(profileKeys).toMatchInlineSnapshot(`
      [
        "activeCaseId",
        "assessment",
        "birthDate",
        "city",
        "education",
        "email",
        "id",
        "mobile",
        "name",
        "onboardingCompleted",
        "updatedAt",
        "version",
      ]
    `);
    for (const key of profileKeys) {
      expect(FORBIDDEN_STAFF_FIELDS).not.toContain(key);
    }

    // 5) StudentPaymentSummary
    const summaryRes = await studentPanelHandlers.getMyPaymentSummary.run(ctx(studentA));
    const summary = summaryRes.data as Record<string, unknown>;
    const summaryKeys = Object.keys(summary).sort();
    expect(summaryKeys).toMatchInlineSnapshot(`
      [
        "nextDueAmount",
        "nextDueDate",
        "nextDueTitle",
        "overdueCount",
        "totalContract",
        "totalDue",
        "totalPaid",
      ]
    `);
    for (const key of summaryKeys) {
      expect(FORBIDDEN_STAFF_FIELDS).not.toContain(key);
    }

    // 6) StudentTasks
    const tasksRes = await studentPanelHandlers.listMyStudentTasks.run(ctx(studentA));
    const tasks = tasksRes.data as Record<string, unknown>[];
    if (tasks.length > 0) {
      const taskKeys = Object.keys(tasks[0]).sort();
      for (const key of taskKeys) {
        expect(FORBIDDEN_STAFF_FIELDS).not.toContain(key);
      }
    }
  });

  /* -------------------------------------------------------------------------- */
  /*  3. Rate limiting (429 and Retry-After)                                    */
  /* -------------------------------------------------------------------------- */

  it("OTP request rate limiting returns 429 with Retry-After header", async () => {
    try {
      await authHandlers.requestOtp.run({
        ...ctx(null),
        body: { mobile: "09124294290" },
      });
      expect.unreachable("Expected 429 RATE_LIMITED");
    } catch (error) {
      expect(error).toBeInstanceOf(MockApiError);
      const apiErr = error as MockApiError;
      expect(apiErr.status).toBe(429);
      expect(apiErr.code).toBe("RATE_LIMITED");
      expect(apiErr.headers?.["Retry-After"]).toBeTruthy();
      expect(Number(apiErr.headers?.["Retry-After"])).toBeGreaterThan(0);
    }
  });

  it("file upload rate limiting returns 429 with Retry-After header", async () => {
    const formData = new FormData();
    formData.append(
      "file",
      new File([new Uint8Array([1, 2, 3])], "test.jpg", { type: "image/jpeg" }),
    );

    try {
      await fileHandlers.uploadFile.run({
        ...ctx(studentA, { headers: { "x-mock-rate-limit": "upload" } }),
        body: formData,
      });
      expect.unreachable("Expected 429 RATE_LIMITED");
    } catch (error) {
      expect(error).toBeInstanceOf(MockApiError);
      const apiErr = error as MockApiError;
      expect(apiErr.status).toBe(429);
      expect(apiErr.code).toBe("RATE_LIMITED");
      expect(apiErr.headers?.["Retry-After"]).toBe("30");
    }
  });

  /* -------------------------------------------------------------------------- */
  /*  4. XSS Protection: Message text is NEVER rendered as HTML                 */
  /* -------------------------------------------------------------------------- */

  it("XSS protection: message text is never HTML rendered across student views", async () => {
    const xssPayload = "<script>alert('xss')</script><img src=x onerror=alert(1)>";
    const msgRes = await studentPanelHandlers.createMyTicketMessage.run({
      ...ctx(studentA),
      params: { id: ticketAId },
      body: { body: xssPayload, attachmentIds: [] },
    });
    const message = msgRes.data as { body: string };
    expect(message.body).toBe(xssPayload);

    // Verify all message rendering components render body as safe text nodes
    const fs = await import("node:fs");
    const bubbleSource = fs.readFileSync(
      "src/components/tickets/ticket-message-bubble.tsx",
      "utf-8",
    );
    expect(bubbleSource).not.toContain("dangerouslySetInnerHTML");
    expect(bubbleSource).toContain("{message.body}");

    const threadSource = fs.readFileSync(
      "src/components/panel/student/messages/student-ticket-thread-view.tsx",
      "utf-8",
    );
    expect(threadSource).not.toContain("dangerouslySetInnerHTML");
  });
});
