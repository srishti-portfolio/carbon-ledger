import { describe, it, expect, vi } from "vitest";
import { hashPassword, verifyPassword, signToken, requireAuth } from "./auth.js";

describe("password hashing", () => {
  it("verifies a correct password and rejects a wrong one", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash).not.toBe("correct horse battery");
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await verifyPassword("wrong password", hash)).toBe(false);
  });
});

describe("signToken", () => {
  it("returns a three-part JWT string", () => {
    const token = signToken("user-123");
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });
});

describe("requireAuth middleware", () => {
  const mockRes = () => {
    const res = {};
    res.status = vi.fn(() => res);
    res.json = vi.fn(() => res);
    return res;
  };

  it("calls next and sets req.userId for a valid token", () => {
    const req = { headers: { authorization: `Bearer ${signToken("abc")}` } };
    const res = mockRes();
    const next = vi.fn();
    requireAuth(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.userId).toBe("abc");
  });

  it("responds 401 when no token is present", () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = vi.fn();
    requireAuth(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("responds 401 for a malformed token", () => {
    const req = { headers: { authorization: "Bearer not.a.jwt" } };
    const res = mockRes();
    const next = vi.fn();
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
