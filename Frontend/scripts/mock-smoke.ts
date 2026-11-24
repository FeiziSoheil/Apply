/**
 * Smoke test of the mock API (no browser, no Next server).
 *
 *   npm run mock:smoke
 *
 * Starts `msw/node` with the same handlers the app uses, then:
 *   1. submits a quick-contact lead and an assessment lead (public endpoints)
 *   2. logs in as staff and checks both leads show up in `GET /leads`
 *   3. sweeps every parameter-less GET endpoint (and the first item of each
 *      list) as admin and as student — a 500 or a contract violation fails
 *   4. checks the error scenarios and the honeypot
 *   5. session transport: tokens only in `x-mock-*` headers, the API client's
 *      mock/cookie session adapters, `mock_session` cookie, route protection
 *   6. OTP limits: 3 attempts, 2-minute expiry
 *   7. dev token persistence (sessionStorage), mock-safety / demo build rules,
 *      PATCH content updates, currency fields
 */
process.env.NEXT_PUBLIC_API_URL = "http://mock.test/api/v1";
process.env.NEXT_PUBLIC_API_MOCKING = "enabled";
process.env.NEXT_PUBLIC_API_MOCK_DELAY = "off";

type Json = Record<string, unknown>;
type Reply = { status: number; headers: Headers; body: Json | null };

const BASE = process.env.NEXT_PUBLIC_API_URL;
const failures: string[] = [];
let checks = 0;

function check(name: string, condition: boolean, detail?: unknown): void {
  checks += 1;
  if (condition) {
    console.log(`  ok   ${name}`);
  } else {
    console.log(`  FAIL ${name}${detail === undefined ? "" : ` — ${JSON.stringify(detail)}`}`);
    failures.push(name);
  }
}

async function call(
  method: string,
  path: string,
  options: { body?: unknown; token?: string; scenario?: string } = {},
): Promise<Reply> {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.scenario ? { "x-mock-scenario": options.scenario } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  }).catch((error: unknown) => {
    throw new Error(`${method} ${path}: no mock handler matched (${String(error)})`);
  });
  const text = await response.text();
  return {
    status: response.status,
    headers: response.headers,
    body: text ? (JSON.parse(text) as Json) : null,
  };
}

const asRecord = (value: unknown): Json =>
  typeof value === "object" && value !== null ? (value as Json) : {};
const asList = (value: unknown): Json[] => (Array.isArray(value) ? value.map(asRecord) : []);

/** Tokens of a login live in `x-mock-*` headers, never in the JSON body */
function tokensOf(reply: Reply): { access: string; refresh: string; role: string } {
  return {
    access: reply.headers.get("x-mock-access-token") ?? "",
    refresh: reply.headers.get("x-mock-refresh-token") ?? "",
    role: reply.headers.get("x-mock-user-role") ?? "",
  };
}

async function main(): Promise<void> {
  const [{ startMockServer, stopMockServer }, { endpointSpecs }, { DEMO_ACCOUNTS }, { getDb }] =
    await Promise.all([
      import("../src/mocks/server"),
      import("../src/contracts/registry"),
      import("../src/mocks/config"),
      import("../src/mocks/db"),
    ]);
  startMockServer();

  const db = getDb();
  console.log(
    `Seed: ${db.leads.count()} leads, ${db.cases.count()} students, ${db.bookings.count()} bookings, ` +
      `${db.tickets.count()} tickets, ${db.documents.count()} documents, ${db.invoices.count()} invoices`,
  );

  /* ----- 1. Public lead creation ----- */
  console.log("\n[1] Public forms");
  const before = db.leads.count();
  const mobile = "09351234567";
  const quick = await call("POST", "/leads/quick-contact", {
    body: {
      source: "contact",
      name: "علی رضایی",
      mobile,
      message: "می‌خواهم درباره تحصیل در آلمان مشاوره بگیرم",
    },
  });
  check("quick-contact → 201", quick.status === 201, quick);

  const assessmentMobile = "09129998877";
  const assessment = await call("POST", "/leads/assessment", {
    body: {
      currentDegree: "bachelor",
      targetDegree: "master",
      fieldOfStudy: "مهندسی کامپیوتر",
      gpa: 17.5,
      languageStatus: "ielts",
      languageScore: 6.5,
      targetCountries: ["germany", "canada"],
      annualBudget: 12000,
      currency: "EUR",
      startTime: "six_months",
      needsScholarship: true,
      name: "سارا محمدی",
      mobile: assessmentMobile,
      contactPreference: "whatsapp",
      agreeToTerms: true,
    },
  });
  check("assessment → 201", assessment.status === 201, assessment);
  check("two new leads in the db", db.leads.count() === before + 2);

  const invalid = await call("POST", "/leads/quick-contact", { body: { mobile: "123" } });
  check(
    "invalid mobile → 400 VALIDATION_ERROR with fields",
    invalid.status === 400 &&
      asRecord(asRecord(invalid.body).error).code === "VALIDATION_ERROR" &&
      Object.keys(asRecord(asRecord(asRecord(invalid.body).error).fields)).length > 0,
    invalid,
  );

  const honeypot = await call("POST", "/leads/quick-contact", {
    body: { mobile: "09350000001", website: "http://spam.example" },
  });
  check("honeypot → fake 201", honeypot.status === 201, honeypot);
  check("honeypot creates no lead", db.leads.count() === before + 2);

  /* ----- 2. Staff login + leads list ----- */
  console.log("\n[2] Leads list as admin");
  const anonymous = await call("GET", "/leads");
  check("GET /leads without session → 401", anonymous.status === 401, anonymous.status);

  const login = await call("POST", "/auth/login", { body: DEMO_ACCOUNTS.admin });
  const adminTokens = tokensOf(login);
  const adminToken = adminTokens.access;
  check("staff login → 200 + mock token header", login.status === 200 && adminToken.length > 0, login);
  check(
    "login body has no tokens (session = httpOnly cookie)",
    !("accessToken" in asRecord(asRecord(login.body).data)) &&
      !("refreshToken" in asRecord(asRecord(login.body).data)),
    login.body,
  );
  check(
    "login sets an httpOnly `session` cookie",
    /^session=[^;]+;.*HttpOnly/i.test(login.headers.get("set-cookie") ?? ""),
    login.headers.get("set-cookie"),
  );

  const me = await call("GET", "/me", { token: adminToken });
  check("GET /me → admin", asRecord(asRecord(me.body).data).role === "admin", me);

  const list = await call("GET", "/leads?pageSize=100&sort=createdAt&order=desc", { token: adminToken });
  const items = asList(asRecord(list.body).data);
  check("GET /leads → 200", list.status === 200, list.status);
  const pagination = asRecord(asRecord(asRecord(list.body).meta).pagination);
  check("pagination total matches db", pagination.total === db.leads.count(), pagination);
  check(
    "quick-contact lead is listed",
    items.some((lead) => lead.mobile === mobile && lead.source === "contact"),
  );
  check(
    "assessment lead is listed",
    items.some((lead) => lead.mobile === assessmentMobile && lead.source === "assessment"),
  );
  const searched = await call("GET", `/leads?q=${assessmentMobile}`, { token: adminToken });
  check(
    "search by mobile finds the assessment lead",
    asList(asRecord(searched.body).data).some((lead) => lead.mobile === assessmentMobile),
  );

  const created = items.find((lead) => lead.mobile === mobile);
  if (created) {
    const patched = await call("PATCH", `/leads/${String(created.id)}/status`, {
      token: adminToken,
      body: { status: "contacted" },
    });
    check("PATCH lead status → 200", patched.status === 200, patched);
    const fetched = await call("GET", `/leads/${String(created.id)}`, { token: adminToken });
    check(
      "status change is persisted in memory",
      asRecord(asRecord(fetched.body).data).stageKind === "open",
    );
  }

  /* ----- 2b. Admin stats (live aggregation) ----- */
  console.log("\n[2b] GET /admin/stats");
  const statsBefore = await call("GET", "/admin/stats?rangeDays=30", { token: adminToken });
  check("GET /admin/stats → 200", statsBefore.status === 200, statsBefore.status);
  const statsData = asRecord(asRecord(statsBefore.body).data);
  const cards = asRecord(statsData.cards);
  const newLeadsBefore = Number(asRecord(cards.newLeads).value ?? -1);
  check(
    "stats has cards + leadTrend + funnel",
    Array.isArray(statsData.leadTrend) &&
      Array.isArray(statsData.funnel) &&
      Array.isArray(statsData.utmSources) &&
      Array.isArray(statsData.actionItems) &&
      Array.isArray(statsData.todaySchedule) &&
      newLeadsBefore >= 0,
    { keys: Object.keys(statsData), newLeadsBefore },
  );
  check(
    "leadTrend length matches rangeDays",
    asList(statsData.leadTrend).length === 30,
    asList(statsData.leadTrend).length,
  );

  const statsMobile = "09351112233";
  const statsLead = await call("POST", "/leads/quick-contact", {
    body: {
      source: "callback",
      name: "آمار تستی",
      mobile: statsMobile,
      message: "پیام برای آزمون افزایش آمار داشبورد",
    },
  });
  check("extra lead for stats → 201", statsLead.status === 201, statsLead);
  const statsAfter = await call("GET", "/admin/stats?rangeDays=30", { token: adminToken });
  const newLeadsAfter = Number(
    asRecord(asRecord(asRecord(asRecord(statsAfter.body).data).cards).newLeads).value ?? -1,
  );
  check(
    "creating a public lead increments newLeads",
    newLeadsAfter === newLeadsBefore + 1,
    { newLeadsBefore, newLeadsAfter },
  );

  const badRange = await call("GET", "/admin/stats?rangeDays=14", { token: adminToken });
  check(
    "invalid rangeDays → 400",
    badRange.status === 400 &&
      asRecord(asRecord(badRange.body).error).code === "VALIDATION_ERROR",
    badRange,
  );

  /* ----- 3. GET sweep ----- */
  console.log("\n[3] GET sweep (contract validation of every response)");
  const otp = await call("POST", "/auth/otp/request", { body: { mobile: DEMO_ACCOUNTS.student.mobile } });
  check("OTP request → 200/204", otp.status === 200 || otp.status === 204, otp);
  const verified = await call("POST", "/auth/otp/verify", {
    body: { mobile: DEMO_ACCOUNTS.student.mobile, code: DEMO_ACCOUNTS.student.otp },
  });
  const studentToken = tokensOf(verified).access;
  check("OTP verify → session", verified.status === 200 && studentToken.length > 0, verified);

  const gets = endpointSpecs.filter((spec) => spec.method === "get");
  const listPaths = new Set(gets.map((spec) => spec.path));
  let sweepOk = 0;
  for (const spec of gets) {
    const listLike = !spec.path.includes("{");
    for (const [role, token] of [["admin", adminToken], ["student", studentToken]] as const) {
      const targets: string[] = [];
      if (listLike) {
        targets.push(spec.path);
      } else {
        const base = spec.path.slice(0, spec.path.indexOf("/{"));
        const paramName = /\{(\w+)\}/.exec(spec.path)?.[1] ?? "id";
        if (spec.path.split("{").length !== 2 || !spec.path.endsWith("}")) continue;
        if (!listPaths.has(base)) continue;
        const parent = await call("GET", `${base}?pageSize=1`, { token });
        const first = asList(asRecord(parent.body).data)[0];
        const value = first?.[paramName] ?? first?.id ?? first?.slug;
        if (value === undefined) continue;
        targets.push(`${base}/${String(value)}`);
      }
      for (const target of targets) {
        const reply = await call("GET", target, { token });
        const violation = reply.headers.get("x-mock-contract-violation");
        const broken = reply.status >= 500 || violation !== null;
        if (broken) {
          check(`${role} GET ${target}`, false, { status: reply.status, violation, body: reply.body });
        } else if (reply.status < 300) {
          sweepOk += 1;
        }
      }
    }
  }
  check(`sweep: no 5xx / contract violations (${sweepOk} OK responses)`, !failures.some((f) => f.startsWith("admin GET") || f.startsWith("student GET")));

  /* ----- 3b. RBAC: /me permissions + permission 403s ----- */
  console.log("\n[3b] RBAC permissions");
  const { permissionsForRole } = await import("../src/lib/rbac/permissions");
  const consultantLogin = await call("POST", "/auth/login", { body: DEMO_ACCOUNTS.consultant });
  const consultantToken = tokensOf(consultantLogin).access;
  const permissionsOf = async (token: string): Promise<unknown> =>
    asRecord(asRecord((await call("GET", "/me", { token })).body).data).permissions;
  check("GET /me (admin) returns the admin role's permissions", JSON.stringify(await permissionsOf(adminToken)) === JSON.stringify(permissionsForRole("admin")));
  check("GET /me (consultant) returns the consultant role's permissions", JSON.stringify(await permissionsOf(consultantToken)) === JSON.stringify(permissionsForRole("consultant")));
  check("GET /me (student) returns the student role's permissions", JSON.stringify(await permissionsOf(studentToken)) === JSON.stringify(permissionsForRole("student")));

  const consultantStats = await call("GET", "/admin/stats?rangeDays=7", { token: consultantToken });
  check("consultant GET /admin/stats → 200", consultantStats.status === 200, consultantStats.status);
  const consultantNewLeads = Number(
    asRecord(asRecord(asRecord(asRecord(consultantStats.body).data).cards).newLeads).value ?? -1,
  );
  check(
    "consultant newLeads ≤ admin newLeads (scoped)",
    consultantNewLeads >= 0 && consultantNewLeads <= newLeadsAfter,
    { consultantNewLeads, newLeadsAfter },
  );
  const studentStats = await call("GET", "/admin/stats", { token: studentToken });
  check(
    "student GET /admin/stats → 403",
    studentStats.status === 403 &&
      asRecord(asRecord(studentStats.body).error).code === "FORBIDDEN",
    studentStats,
  );

  const firstCountry = asList(asRecord((await call("GET", "/countries?pageSize=1")).body).data)[0];
  const countryId = String(firstCountry?.id ?? "");
  const firstUniversity = asList(
    asRecord((await call("GET", "/universities?pageSize=1", { token: adminToken })).body).data,
  )[0];
  const universityId = String(firstUniversity?.id ?? "");
  const firstProgram = asList(
    asRecord((await call("GET", "/programs?pageSize=1", { token: adminToken })).body).data,
  )[0];
  const programId = String(firstProgram?.id ?? "");
  const firstLead = items[0];
  const leadId = String(firstLead?.id ?? "");
  const denied: [string, string, string, string, unknown][] = [
    ["consultant PATCH /countries/{id} (content:write)", "PATCH", `/countries/${countryId}`, consultantToken, { nameFa: "x" }],
    ["consultant DELETE /countries/{id} (content:delete)", "DELETE", `/countries/${countryId}`, consultantToken, undefined],
    ["consultant PATCH /universities/{id} (content:write)", "PATCH", `/universities/${universityId}`, consultantToken, { nameFa: "x" }],
    ["consultant DELETE /programs/{id} (content:delete)", "DELETE", `/programs/${programId}`, consultantToken, undefined],
    ["consultant DELETE /leads/{id} (lead:delete)", "DELETE", `/leads/${leadId}`, consultantToken, undefined],
    ["consultant PUT /leads/{id}/assignee (lead:assign)", "PUT", `/leads/${leadId}/assignee`, consultantToken, {}],
    ["consultant POST /invoices (payment:manage)", "POST", "/invoices", consultantToken, {}],
    ["student GET /leads (lead:read)", "GET", "/leads", studentToken, undefined],
    ["student PATCH /countries/{id} (content:write)", "PATCH", `/countries/${countryId}`, studentToken, { nameFa: "x" }],
    ["student GET /cases (staff only)", "GET", "/cases", studentToken, undefined],
  ];
  for (const [name, method, path, token, body] of denied) {
    const reply = await call(method, path, { token, body });
    check(
      `${name} → 403 FORBIDDEN`,
      reply.status === 403 && asRecord(asRecord(reply.body).error).code === "FORBIDDEN",
      { status: reply.status, body: reply.body },
    );
  }

  /* ----- 4. Scenarios (5 important surfaces) ----- */
  console.log("\n[4] Scenarios");
  const scenarioSurfaces: Array<{ name: string; method: string; path: string; body?: unknown }> = [
    { name: "countries list", method: "GET", path: "/countries?pageSize=5" },
    {
      name: "country form (PATCH)",
      method: "PATCH",
      path: `/countries/${countryId}`,
      body: { nameFa: "آزمایش سناریو" },
    },
    { name: "bookings", method: "GET", path: "/bookings?pageSize=5" },
    { name: "users", method: "GET", path: "/users?pageSize=5" },
    { name: "dashboard stats", method: "GET", path: "/admin/stats?rangeDays=7" },
  ];
  const expected: [string, number][] = [
    ["server_error", 500],
    ["forbidden", 403],
    ["unauthorized", 401],
  ];
  for (const surface of scenarioSurfaces) {
    for (const [scenario, status] of expected) {
      const reply = await call(surface.method, surface.path, {
        token: adminToken,
        scenario,
        body: surface.body,
      });
      check(
        `${surface.name} ${scenario} → ${status}`,
        reply.status === status,
        reply.status,
      );
    }
    const empty = await call(surface.method, surface.path, {
      token: adminToken,
      scenario: "empty",
      body: surface.body,
    });
    if (surface.method === "GET") {
      const emptyPagination = asRecord(asRecord(asRecord(empty.body).meta).pagination);
      const isList =
        Array.isArray(asRecord(empty.body).data) ||
        typeof emptyPagination.total === "number";
      if (isList && typeof emptyPagination.total === "number") {
        check(
          `${surface.name} empty → total 0`,
          empty.status === 200 && emptyPagination.total === 0,
          empty,
        );
      } else {
        check(`${surface.name} empty → 200`, empty.status === 200, empty.status);
      }
    }
  }
  const viaQuery = await call("GET", "/leads?__scenario=server_error", { token: adminToken });
  check("?__scenario=server_error → 500", viaQuery.status === 500, viaQuery.status);
  const validation = await call("POST", "/leads/quick-contact", {
    scenario: "validation_error",
    body: { mobile, name: "علی رضایی" },
  });
  check(
    "validation_error → 400 with fields",
    validation.status === 400 &&
      Object.keys(asRecord(asRecord(asRecord(validation.body).error).fields)).length > 0,
    validation,
  );
  const countryValidation = await call("PATCH", `/countries/${countryId}`, {
    token: adminToken,
    scenario: "validation_error",
    body: { nameFa: "آزمایش" },
  });
  check(
    "country form validation_error → 400 with fields",
    countryValidation.status === 400 &&
      Object.keys(asRecord(asRecord(asRecord(countryValidation.body).error).fields)).length > 0,
    countryValidation,
  );

  /* ----- 4b. Public publication filter ----- */
  console.log("\n[4b] Public publication filter");
  const publicCountries = asList(
    asRecord((await call("GET", "/countries?pageSize=100")).body).data,
  );
  check(
    "anonymous countries omit draft-sample-country",
    !publicCountries.some((item) => item.slug === "draft-sample-country"),
  );
  const publicBlog = asList(
    asRecord((await call("GET", "/blog-posts?pageSize=100")).body).data,
  );
  check(
    "anonymous blog omits draft + future scheduled",
    !publicBlog.some(
      (item) =>
        item.slug === "draft-visa-interview-guide" ||
        item.slug === "scheduled-tuition-update",
    ),
  );
  check(
    "anonymous blog includes showcase published article",
    publicBlog.some((item) => item.slug === "how-to-choose-country"),
  );
  const draftCountry = await call(
    "GET",
    "/countries/slug/draft-sample-country",
  );
  check("GET draft country by slug → 404", draftCountry.status === 404, draftCountry.status);
  const showcase = await call(
    "GET",
    "/blog-posts/slug/how-to-choose-country",
  );
  check("GET published showcase blog → 200", showcase.status === 200, showcase.status);

  await sessionSection();
  await otpSection();
  await infraSection();

  stopMockServer();
  console.log(`\n${checks - failures.length}/${checks} checks passed`);
  if (failures.length > 0) {
    console.error(`Failed: ${failures.join("; ")}`);
    process.exit(1);
  }
}


/* -------------------------------------------------------------------------- */
/*  5. Session transport                                                      */
/* -------------------------------------------------------------------------- */

async function sessionSection(): Promise<void> {
  console.log("\n[5] Session transport (adapter, mock_session cookie, route protection)");
  const [
    { DEMO_ACCOUNTS },
    { api },
    { currentUserSchema },
    { z },
    adapters,
    cookies,
    access,
    routes,
  ] = await Promise.all([
    import("../src/mocks/config"),
    import("../src/lib/api/client"),
    import("../src/contracts/auth"),
    import("zod"),
    import("../src/lib/api/session-adapter"),
    import("../src/lib/auth/mock-session-cookie"),
    import("../src/lib/auth/route-access"),
    import("../src/lib/auth/routes"),
  ]);
  const { clearSession, onSessionExpired } = await import("../src/lib/api/session");

  // Minimal browser stand-ins so the mock adapter behaves as it does in a page
  const written: string[] = [];
  const fakeDocument = {
    set cookie(value: string) {
      written.push(value);
    },
    get cookie() {
      return written.at(-1) ?? "";
    },
  };
  Object.assign(globalThis, {
    window: {
      location: { origin: "http://mock.test", search: "", pathname: "/login" }, // /login: no redirect
      sessionStorage: { getItem: () => null, setItem: () => undefined, removeItem: () => undefined },
    },
    document: fakeDocument,
  });

  const mockAdapter = adapters.createMockSessionAdapter();
  const previous = adapters.setSessionAdapter(mockAdapter);
  try {
    check("mock adapter is Bearer-in-memory", mockAdapter.kind === "mock-bearer");

    const anonymous = await api.get("/me", currentUserSchema, { skipAuthRedirect: true }).then(
      () => 200,
      (error: { status?: number }) => error.status ?? 0,
    );
    check("client without session → 401", anonymous === 401, anonymous);

    const staffSession = z.object({ user: z.object({ role: z.string() }) });
    const staff = await api.post("/auth/login", staffSession, DEMO_ACCOUNTS.admin, {
      skipAuthRedirect: true,
    });
    check("client staff login → admin", staff.user.role === "admin", staff);
    check("adapter holds the Bearer token in memory", (mockAdapter.getAccessToken() ?? "").startsWith("mock_at_"));
    check(
      "mock_session cookie written after login (role=admin)",
      cookies.parseMockSession(
        written.at(-1)?.split(";")[0]?.slice(`${cookies.MOCK_SESSION_COOKIE_NAME}=`.length),
      )?.role === "admin",
      written.at(-1),
    );
    check(
      "mock_session cookie is not httpOnly",
      !/httponly/i.test(written.at(-1) ?? ""),
      written.at(-1),
    );

    const me = await api.get("/me", currentUserSchema);
    check("client sends Bearer → GET /me as admin", me.role === "admin", me);

    // Real mode: Authorization is never sent, even when a caller passes one
    adapters.setSessionAdapter(adapters.cookieSessionAdapter);
    const real = await api
      .get("/me", currentUserSchema, {
        skipAuthRedirect: true,
        headers: { Authorization: `Bearer ${mockAdapter.getAccessToken() ?? ""}` },
      })
      .then(
        () => 200,
        (error: { status?: number }) => error.status ?? 0,
      );
    check("cookie adapter never sends Authorization → 401", real === 401, real);
    adapters.setSessionAdapter(mockAdapter);

    // Refresh uses the in-memory refresh token and rotates it
    const before = mockAdapter.getAccessToken();
    await api.post("/auth/refresh", staffSession, undefined, { skipAuthRedirect: true });
    check(
      "refresh rotates the in-memory token",
      mockAdapter.getAccessToken() !== null && mockAdapter.getAccessToken() !== before,
    );

    // Logout clears the adapter and the cookie
    await api.postVoid("/auth/logout");
    check("logout clears the in-memory token", mockAdapter.getAccessToken() === null);
    check(
      "logout clears the mock_session cookie",
      /Max-Age=0/.test(written.at(-1) ?? "") &&
        (written.at(-1) ?? "").startsWith(`${cookies.MOCK_SESSION_COOKIE_NAME}=;`),
      written.at(-1),
    );

    // 401 clears the session too (wrong token → 401 → handleUnauthorized)
    mockAdapter.setAccessToken("mock_at_stale");
    written.length = 0;
    let expiredNotified = 0;
    const stopListening = onSessionExpired(() => {
      expiredNotified += 1;
    });
    const unauthorized = await api.get("/me", currentUserSchema).then(
      () => 200,
      (error: { status?: number }) => error.status ?? 0,
    );
    check("stale token → 401", unauthorized === 401, unauthorized);
    check("401 clears the in-memory token", mockAdapter.getAccessToken() === null);
    check(
      "401 clears the mock_session cookie",
      written.some((value) => value.startsWith(`${cookies.MOCK_SESSION_COOKIE_NAME}=;`)),
      written,
    );
    check("401 notifies the session-expired listener (dialog)", expiredNotified === 1, expiredNotified);
    stopListening();
    clearSession();
  } finally {
    adapters.setSessionAdapter(previous);
    delete (globalThis as Record<string, unknown>).window;
    delete (globalThis as Record<string, unknown>).document;
  }

  // Route protection: same decisions with `mock_session` (mock) and `session` (real)
  const jar = (entries: Record<string, string>) => ({
    get: (name: string) => (name in entries ? { value: entries[name] } : undefined),
  });
  const mockCookie = (role: string) => ({
    [cookies.MOCK_SESSION_COOKIE_NAME]: cookies.serializeMockSession({ role: role as "admin" }),
  });
  const decide = (pathname: string, mockingEnabled: boolean, entries: Record<string, string>) =>
    access.decideRouteAccess({ pathname, mockingEnabled, cookies: jar(entries) }).type;
  const decideFull = (pathname: string, mockingEnabled: boolean, entries: Record<string, string>) => {
    const decision = access.decideRouteAccess({ pathname, mockingEnabled, cookies: jar(entries) });
    return decision.type === "forbidden" ? `forbidden:${decision.redirectTo}` : decision.type;
  };

  check("public page is always allowed", decide("/programs", true, {}) === "allow" && decide("/programs", false, {}) === "allow");
  check("login pages are never proxied", decide("/login", true, mockCookie("student")) === "allow" && decide("/staff/login", false, { session: "x" }) === "allow");
  check("old /dashboard is no longer protected", decide("/dashboard", true, {}) === "allow" && decide("/dashboard", false, {}) === "allow");
  check("mock: /panel without mock_session → login", decide("/panel", true, {}) === "login");
  check("mock: real `session` cookie is ignored", decide("/panel", true, { session: "x" }) === "login");
  check("mock: student → /panel allowed", decide("/panel", true, mockCookie("student")) === "allow");
  check("mock: student → /admin forbidden → /panel", decideFull("/admin/users", true, mockCookie("student")) === "forbidden:/panel");
  check("mock: admin → /admin allowed", decide("/admin", true, mockCookie("admin")) === "allow");
  check("mock: consultant → /admin allowed", decide("/admin/leads", true, mockCookie("consultant")) === "allow");
  check("mock: admin → /panel forbidden → /admin", decideFull("/panel", true, mockCookie("admin")) === "forbidden:/admin");
  check("mock: garbage mock_session → login", decide("/panel", true, { mock_session: "%7Bnope" }) === "login");
  check("real: /panel without session → login", decide("/panel", false, {}) === "login");
  check("real: /admin without session → login", decide("/admin", false, {}) === "login");
  check("real: mock_session cookie is ignored", decide("/panel", false, mockCookie("student")) === "login");
  check("real: session cookie → allowed", decide("/panel/cases", false, { session: "opaque" }) === "allow");

  // Login redirects, role homes and returnUrl rules
  const { buildLoginUrl, resolvePostLoginUrl, getRoleHome, loginPathFor } = routes;
  check("student login url keeps returnUrl", buildLoginUrl("/panel/cases?x=1") === "/login?returnUrl=%2Fpanel%2Fcases%3Fx%3D1", buildLoginUrl("/panel/cases?x=1"));
  check("admin area uses staff login", buildLoginUrl("/admin/leads") === "/staff/login?returnUrl=%2Fadmin%2Fleads" && loginPathFor("/admin") === "/staff/login");
  check("login pages are never a returnUrl", buildLoginUrl("/login") === "/login" && buildLoginUrl("/staff/login?returnUrl=%2Fadmin") === "/login");
  check("role homes: admin & consultant → /admin, student → /panel", getRoleHome("admin") === "/admin" && getRoleHome("consultant") === "/admin" && getRoleHome("student") === "/panel");
  check("post-login: no returnUrl → role home", resolvePostLoginUrl("student") === "/panel" && resolvePostLoginUrl("admin") === "/admin");
  check("post-login: allowed returnUrl is honored", resolvePostLoginUrl("student", "/panel/cases") === "/panel/cases" && resolvePostLoginUrl("consultant", "/admin/leads") === "/admin/leads");
  check("post-login: returnUrl of another role is ignored", resolvePostLoginUrl("student", "/admin") === "/panel" && resolvePostLoginUrl("admin", "/panel") === "/admin");
  check("post-login: unsafe / login returnUrl is ignored", resolvePostLoginUrl("student", "//evil.example") === "/panel" && resolvePostLoginUrl("student", "https://evil.example") === "/panel" && resolvePostLoginUrl("student", "/login") === "/panel");
}

/* -------------------------------------------------------------------------- */
/*  6. OTP limits                                                             */
/* -------------------------------------------------------------------------- */

async function otpSection(): Promise<void> {
  console.log("\n[6] OTP limits (3 attempts, 2-minute expiry)");
  const [{ DEMO_ACCOUNTS, OTP_EXPIRES_IN_SECONDS, OTP_MAX_VERIFY_ATTEMPTS }] = await Promise.all([
    import("../src/mocks/config"),
  ]);
  const good = DEMO_ACCOUNTS.student.otp;
  const verify = (mobile: string, code: string) =>
    call("POST", "/auth/otp/verify", { body: { mobile, code } });
  const request = (mobile: string) => call("POST", "/auth/otp/request", { body: { mobile } });
  const codeError = (reply: Reply) =>
    Object.keys(asRecord(asRecord(asRecord(reply.body).error).fields)).includes("code");

  check("contract: 3 attempts, 120 s", OTP_MAX_VERIFY_ATTEMPTS === 3 && OTP_EXPIRES_IN_SECONDS === 120);

  const neverRequested = await verify("09121110001", good);
  check("verify without a requested OTP → 400 on `code`", neverRequested.status === 400 && codeError(neverRequested), neverRequested);

  // 3 wrong codes kill the OTP — even the right code fails afterwards
  const m1 = "09121110002";
  await request(m1);
  const w1 = await verify(m1, "111111");
  const w2 = await verify(m1, "222222");
  check("wrong code (attempt 1, 2) → 400", w1.status === 400 && w2.status === 400);
  const w3 = await verify(m1, "333333");
  check("3rd wrong code → 400", w3.status === 400 && codeError(w3), w3);
  const afterLock = await verify(m1, good);
  check("correct code after 3 failures → 400 (OTP is dead)", afterLock.status === 400 && codeError(afterLock), afterLock);
  await request(m1);
  const fresh = await verify(m1, good);
  check("new OTP request resets attempts → login works", fresh.status === 200, fresh);

  // 2 wrong codes + the right one still succeeds (limit is 3 failures)
  const m2 = "09121110003";
  await request(m2);
  await verify(m2, "111111");
  await verify(m2, "222222");
  const lastChance = await verify(m2, good);
  check("2 wrong + correct code → 200", lastChance.status === 200, lastChance);

  // Expiry: 2 minutes. Move the clock instead of waiting.
  const m3 = "09121110004";
  await request(m3);
  const realNow = Date.now;
  Date.now = () => realNow() + (OTP_EXPIRES_IN_SECONDS - 1) * 1000;
  const justInTime = await verify(m3, good);
  check("code 119 s old → accepted", justInTime.status === 200, justInTime);

  const m4 = "09121110005";
  Date.now = realNow;
  await request(m4);
  Date.now = () => realNow() + (OTP_EXPIRES_IN_SECONDS + 1) * 1000;
  const expired = await verify(m4, good);
  Date.now = realNow;
  check("code 121 s old → 400 expired", expired.status === 400 && codeError(expired), expired);
}

/* -------------------------------------------------------------------------- */
/*  7. Token persistence, mock-safety, PATCH, currency                        */
/* -------------------------------------------------------------------------- */

async function infraSection(): Promise<void> {
  console.log("\n[7] token persistence, mock-safety, PATCH, currency");
  const [adapters, safety, { endpointSpecs }, { getDb }] = await Promise.all([
    import("../src/lib/api/session-adapter"),
    import("../src/lib/mock-safety"),
    import("../src/contracts/registry"),
    import("../src/mocks/db"),
  ]);

  // sessionStorage persistence of the mock Bearer tokens
  const store = new Map<string, string>();
  const warnings: unknown[][] = [];
  let failWrites = false;
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    warnings.push(args);
  };
  Object.assign(globalThis, {
    window: {
      sessionStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          if (failWrites) throw new Error("QuotaExceededError");
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
        },
      },
    },
    document: { cookie: "" },
  });
  try {
    const login = new Response(null, {
      headers: {
        "x-mock-access-token": "mock_at_a",
        "x-mock-refresh-token": "mock_rt_a",
        "x-mock-user-role": "admin",
      },
    });
    const persisted = adapters.createMockSessionAdapter({ persistTokens: true });
    persisted.onResponse(login);
    const stored = store.get(adapters.MOCK_TOKENS_STORAGE_KEY) ?? "";
    check(
      "tokens are mirrored into sessionStorage",
      stored.includes("mock_at_a") && stored.includes("mock_rt_a"),
      stored,
    );
    const restored = adapters.createMockSessionAdapter({ persistTokens: true });
    check(
      "page load restores access + refresh token into the adapter",
      restored.getAccessToken() === "mock_at_a" &&
        restored.getRequestHeaders("/auth/refresh")["x-mock-refresh-token"] === "mock_rt_a" &&
        restored.getRequestHeaders("/me").Authorization === "Bearer mock_at_a",
    );
    const memoryOnly = adapters.createMockSessionAdapter({ persistTokens: false });
    check("persistTokens=false never restores from storage", memoryOnly.getAccessToken() === null);
    restored.clear();
    check("clear() removes the persisted tokens", !store.has(adapters.MOCK_TOKENS_STORAGE_KEY));

    failWrites = true;
    const quota = adapters.createMockSessionAdapter({ persistTokens: true });
    quota.onResponse(login);
    check(
      "storage failure keeps the token in memory and warns",
      quota.getAccessToken() === "mock_at_a" && warnings.length > 0,
      warnings.length,
    );
    failWrites = false;
    store.clear();
    check(
      "real (cookie) adapter keeps no token and writes nothing",
      adapters.cookieSessionAdapter.getAccessToken() === null && store.size === 0,
    );
  } finally {
    console.warn = originalWarn;
    delete (globalThis as Record<string, unknown>).window;
    delete (globalThis as Record<string, unknown>).document;
  }

  // mock-safety: production block unless demo build; relaxed auth never allowed
  const base = {
    nodeEnv: "production",
    mocking: undefined,
    authRelaxed: undefined,
    legacyAuthRelaxed: undefined,
    demoBuild: undefined,
  } as const;
  const violations = (env: Partial<Parameters<typeof safety.findMockSafetyViolations>[0]>) =>
    safety.findMockSafetyViolations({ ...base, ...env }).length;
  check("production + mocking → rejected", violations({ mocking: "enabled" }) === 1);
  check(
    "production + mocking + DEMO_BUILD → allowed",
    violations({ mocking: "enabled", demoBuild: "enabled" }) === 0,
  );
  check(
    "production + DEMO_BUILD + relaxed auth → still rejected",
    violations({ mocking: "enabled", demoBuild: "enabled", authRelaxed: "relaxed" }) === 1 &&
      violations({ mocking: "enabled", demoBuild: "enabled", legacyAuthRelaxed: "relaxed" }) === 1,
  );
  check("production without mocking → allowed", violations({}) === 0);
  check(
    "token storage: development or demo build only",
    safety.isMockTokenStorageAllowed({ ...base, nodeEnv: "development", mocking: "enabled" }) &&
      safety.isMockTokenStorageAllowed({ ...base, mocking: "enabled", demoBuild: "enabled" }) &&
      !safety.isMockTokenStorageAllowed({ ...base, mocking: "enabled" }) &&
      !safety.isMockTokenStorageAllowed({ ...base, nodeEnv: "development" }) &&
      !safety.isMockTokenStorageAllowed({ ...base, nodeEnv: "test", mocking: "enabled" }),
  );

  // Content resources are updated with PATCH (operationIds unchanged)
  const resources = [
    "Country", "University", "Program", "Service", "Consultant",
    "SuccessStory", "BlogPost", "NewsItem", "Faq",
  ];
  const updates = resources.map((name) =>
    endpointSpecs.find((spec) => spec.operationId === `update${name}`),
  );
  check(
    "content update operations use PATCH",
    updates.every((spec) => spec?.method === "patch"),
    updates.map((spec) => spec?.method),
  );

  // Currency: educational money has an ISO 4217 code, per-country in the seed
  const db = getDb();
  const codes = (items: { currency: string }[]) => new Set(items.map((item) => item.currency));
  const isoOk = [...codes(db.countries.all()), ...codes(db.universities.all()), ...codes(db.programs.all())]
    .every((code) => /^[A-Z]{3}$/.test(code));
  check("seed currencies are ISO 4217 codes", isoOk);
  check(
    "seed uses real per-country currencies",
    ["CAD", "AUD", "MYR", "TRY", "HUF", "EUR"].every((code) => codes(db.countries.all()).has(code)),
    [...codes(db.countries.all())],
  );

  // Integrity: university with programs cannot be deleted; programsCount is live
  const { DEMO_ACCOUNTS } = await import("../src/mocks/config");
  const staffLogin = await call("POST", "/auth/login", {
    body: DEMO_ACCOUNTS.admin,
  });
  const staffToken = tokensOf(staffLogin).access;
  const uniWithPrograms = db.universities
    .all()
    .find((uni) => db.programs.all().some((p) => p.universitySlug === uni.slug));
  if (uniWithPrograms && staffToken) {
    const liveCount = db.programs
      .all()
      .filter((p) => p.universitySlug === uniWithPrograms.slug).length;
    const getUni = await call("GET", `/universities/${uniWithPrograms.id}`, {
      token: staffToken,
    });
    const uniData = asRecord(asRecord(getUni.body).data);
    check(
      "university.programsCount matches live programs",
      getUni.status === 200 && uniData.programsCount === liveCount,
      {
        status: getUni.status,
        programsCount: uniData.programsCount,
        liveCount,
      },
    );
    const del = await call("DELETE", `/universities/${uniWithPrograms.id}`, {
      token: staffToken,
    });
    check(
      "DELETE university with programs → 409",
      del.status === 409 &&
        asRecord(asRecord(del.body).error).code === "CONFLICT",
      { status: del.status, body: del.body },
    );
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
