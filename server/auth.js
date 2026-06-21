// auth.js — password hashing, JWT, and the auth guard.
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev-insecure-secret-change-me";

export const hashPassword = (pw) => bcrypt.hash(pw, 10);
export const verifyPassword = (pw, hash) => bcrypt.compare(pw, hash);
export const signToken = (userId) => jwt.sign({ sub: userId }, SECRET, { expiresIn: "30d" });

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not signed in" });
  try {
    req.userId = jwt.verify(token, SECRET).sub;
    next();
  } catch {
    res.status(401).json({ error: "Session expired — please sign in again" });
  }
}
