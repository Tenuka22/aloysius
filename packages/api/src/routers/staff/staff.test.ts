import { createRouterClient } from "@orpc/server";
import { describe, expect, it, vi } from "vitest";

import type { Context } from "../../context";
import { appRouter } from "../index";

/** Chainable query-builder stub; the mock db is cast, so arg types are moot. */
const mockFn = () => vi.fn<(...args: unknown[]) => unknown>();

const makeContext = (overrides: Partial<Context> = {}): Context => ({
  auth: null,
  session: null,
  db: {} as Context["db"],
  storage: {} as Context["storage"],
  ...overrides,
});

const makeAdminSession = () =>
  ({
    user: {
      id: "u1",
      name: "Admin",
      email: "admin@example.com",
      role: "admin",
    },
    session: { id: "s1" },
  }) as unknown as Context["session"];

const makeUserSession = () =>
  ({
    user: { id: "u2", name: "User", email: "user@example.com", role: "user" },
    session: { id: "s2" },
  }) as unknown as Context["session"];

const makeMockDb = (overrides: Record<string, unknown> = {}) => {
  const chain = {
    select: mockFn().mockReturnThis(),
    from: mockFn().mockReturnThis(),
    where: mockFn().mockReturnThis(),
    orderBy: mockFn().mockReturnThis(),
    get: mockFn().mockResolvedValue(null),
    all: mockFn().mockResolvedValue([]),
    insert: mockFn().mockReturnThis(),
    values: mockFn().mockReturnThis(),
    returning: mockFn().mockReturnThis(),
    delete: mockFn().mockReturnThis(),
    update: mockFn().mockReturnThis(),
    set: mockFn().mockReturnThis(),
    leftJoin: mockFn().mockReturnThis(),
    run: mockFn().mockResolvedValue(null),
  };
  return { ...chain, ...overrides } as unknown as Context["db"];
};

describe("staff ACL enforcement", () => {
  it("rejects unauthenticated callers on staff endpoints", async () => {
    const client = createRouterClient(appRouter, { context: makeContext() });
    await expect(client.staff.listStaff()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("rejects non-admin callers on staff endpoints", async () => {
    const client = createRouterClient(appRouter, {
      context: makeContext({ session: makeUserSession() }),
    });
    await expect(client.staff.listStaff()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("allows admin callers on staff endpoints", async () => {
    const client = createRouterClient(appRouter, {
      context: makeContext({ session: makeAdminSession(), db: makeMockDb() }),
    });
    const result = await client.staff.listStaff();
    expect(result).toStrictEqual([]);
  });
});

describe("appRouter.staff.listStaff", () => {
  it("returns empty array when no staff exist", async () => {
    const client = createRouterClient(appRouter, {
      context: makeContext({
        session: makeAdminSession(),
        db: makeMockDb(),
      }),
    });
    await expect(client.staff.listStaff()).resolves.toStrictEqual([]);
  });

  it("returns staff list for admin", async () => {
    const mockDb = makeMockDb({
      all: mockFn().mockResolvedValue([
        {
          id: "s1",
          name: "John Perera",
          email: "john@example.com",
          nic: "123456789V",
          phone: "0771234567",
          portraitFileId: null,
          createdAt: new Date("2025-01-01"),
          updatedAt: new Date("2025-01-01"),
        },
      ]),
    });

    const client = createRouterClient(appRouter, {
      context: makeContext({ session: makeAdminSession(), db: mockDb }),
    });
    const result = await client.staff.listStaff();

    expect(result).toHaveLength(1);
    const [first] = result;
    expect(first?.name).toBe("John Perera");
    expect(first?.email).toBe("john@example.com");
  });
});

describe("appRouter.staff.createStaff", () => {
  it("creates a staff member", async () => {
    const mockDb = makeMockDb({
      returning: mockFn().mockReturnValue({
        get: mockFn().mockResolvedValue({
          id: "new-id",
          name: "Jane Silva",
          email: "jane@example.com",
          nic: "987654321V",
          phone: "0779876543",
          createdAt: new Date("2025-01-01"),
          updatedAt: new Date("2025-01-01"),
        }),
      }),
    });

    const client = createRouterClient(appRouter, {
      context: makeContext({ session: makeAdminSession(), db: mockDb }),
    });

    const result = await client.staff.createStaff({
      name: "Jane Silva",
      email: "jane@example.com",
      nic: "987654321V",
      phone: "0779876543",
      gender: undefined,
      birthDate: undefined,
    });

    expect(result.name).toBe("Jane Silva");
    expect(result.email).toBe("jane@example.com");
  });
});

describe("appRouter.staff.getStaff", () => {
  it("returns NOT_FOUND for non-existent staff", async () => {
    const mockDb = makeMockDb({
      get: mockFn().mockResolvedValue(null),
    });

    const client = createRouterClient(appRouter, {
      context: makeContext({ session: makeAdminSession(), db: mockDb }),
    });

    await expect(
      client.staff.getStaff({ id: "nonexistent" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("returns staff member by ID", async () => {
    const mockDb = makeMockDb({
      get: mockFn().mockResolvedValue({
        id: "s1",
        name: "John Perera",
        email: "john@example.com",
        nic: "123456789V",
        phone: "0771234567",
        portraitFileId: null,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-01"),
      }),
    });

    const client = createRouterClient(appRouter, {
      context: makeContext({ session: makeAdminSession(), db: mockDb }),
    });

    const result = await client.staff.getStaff({ id: "s1" });
    expect(result.name).toBe("John Perera");
  });
});

describe("appRouter.staff.deleteStaff", () => {
  it("returns NOT_FOUND for non-existent staff", async () => {
    const mockDb = makeMockDb({
      get: mockFn().mockResolvedValue(null),
    });

    const client = createRouterClient(appRouter, {
      context: makeContext({ session: makeAdminSession(), db: mockDb }),
    });

    await expect(
      client.staff.deleteStaff({ id: "nonexistent" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("deletes staff member", async () => {
    const mockDb = makeMockDb({
      get: mockFn().mockResolvedValue({ id: "s1" }),
    });

    const client = createRouterClient(appRouter, {
      context: makeContext({ session: makeAdminSession(), db: mockDb }),
    });

    const result = await client.staff.deleteStaff({ id: "s1" });
    expect(result).toStrictEqual({ success: true });
  });
});

describe("appRouter.staff.createAcademicYear", () => {
  it("creates an academic year", async () => {
    const mockDb = makeMockDb({
      returning: mockFn().mockReturnValue({
        get: mockFn().mockResolvedValue({
          id: "ay1",
          year: 2027,
          isCurrent: false,
          createdAt: new Date("2025-01-01"),
        }),
      }),
    });

    const client = createRouterClient(appRouter, {
      context: makeContext({ session: makeAdminSession(), db: mockDb }),
    });

    const result = await client.staff.createAcademicYear({ year: 2027 });
    expect(result.year).toBe(2027);
    expect(result.isCurrent).toBeFalsy();
  });
});

describe("appRouter.staff.listSubjects", () => {
  it("returns subjects from constants", async () => {
    const client = createRouterClient(appRouter, {
      context: makeContext({ session: makeAdminSession() }),
    });

    const result = await client.staff.listSubjects();
    expect(result.length).toBeGreaterThan(0);
    expect(
      result.some((s: { level: string }) => s.level === "primary")
    ).toBeTruthy();
  });
});

describe("appRouter.staff.listGrades", () => {
  it("returns grades from constants", async () => {
    const client = createRouterClient(appRouter, {
      context: makeContext({ session: makeAdminSession() }),
    });

    const result = await client.staff.listGrades();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("level");
    expect(result[0]).toHaveProperty("stage");
  });
});

describe("appRouter.staff.listPositions", () => {
  it("returns positions from constants", async () => {
    const client = createRouterClient(appRouter, {
      context: makeContext({ session: makeAdminSession() }),
    });

    const result = await client.staff.listPositions();
    expect(result.positions.length).toBeGreaterThan(0);
    expect(result.sectionalScopes.length).toBeGreaterThan(0);
  });
});

describe("qualification workflow", () => {
  it("rejects unauthenticated callers on qualifications", async () => {
    const client = createRouterClient(appRouter, { context: makeContext() });
    await expect(client.staff.listQualifications({})).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("allows admin to list qualifications", async () => {
    const client = createRouterClient(appRouter, {
      context: makeContext({ session: makeAdminSession(), db: makeMockDb() }),
    });
    const result = await client.staff.listQualifications({});
    expect(result).toStrictEqual([]);
  });

  it("allows admin to approve qualification", async () => {
    const mockDb = makeMockDb({
      get: mockFn().mockResolvedValue({
        id: "q1",
        documentStatus: "pending",
      }),
      returning: mockFn().mockReturnValue({
        get: mockFn().mockResolvedValue({
          id: "q1",
          staffId: "s1",
          qualification: "bachelorEducation",
          documentStatus: "approved",
          reviewedBy: "u1",
          reviewNote: "Verified",
          reviewedAt: new Date("2025-01-02"),
        }),
      }),
    });

    const client = createRouterClient(appRouter, {
      context: makeContext({ session: makeAdminSession(), db: mockDb }),
    });

    const result = await client.staff.approveQualification({
      id: "q1",
      status: "approved",
      reviewNote: "Verified",
    });

    expect(result.documentStatus).toBe("approved");
    expect(result.reviewNote).toBe("Verified");
  });
});
