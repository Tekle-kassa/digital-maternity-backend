import prisma from "../config/prisma";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Role } from "../../generated/prisma/enums";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export class AuthService {
  static async register(username: string, pin: string, role: string) {
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      throw new Error("User already exists");
    }
    const pinHash = await bcrypt.hash(pin, 10);
    return prisma.user.create({
      data: {
        username,
        pinHash,
        role: role as Role,
        languagePreference: "EN",
      },
    });
  }
  static async login(username: string, pin: string) {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) throw new Error("Invalid username or password");
    const ok = await bcrypt.compare(pin, user.pinHash);
    if (!ok) throw new Error("Invalid username or password");
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });
    return {
      token,
      user: { id: user.id, username: user.username, role: user.role },
    };
  }
  static async verifyToken(token: string) {
    return jwt.verify(token, JWT_SECRET);
  }
}
