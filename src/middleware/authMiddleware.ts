import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../config";

// import { Role } from "../../generated/prisma/enums";

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || "supersecretkey";
export interface AuthRequest extends Request {
  user?: { userId: string; roles: string[] };
}
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Missing token" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Invalid token format" });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    (req as AuthRequest).user = {
      userId: payload.userId as string,
      roles: payload.roles,
    };
    next();
  } catch (err) {
    console.log(err);
    res.status(401).json({ message: "Invalid or expired token" });
  }
}
export function authorizeRoles(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const userRoles = req.user.roles || [];
    const hasRole = userRoles.some((role: string) =>
      allowedRoles.includes(role)
    );
    if (!hasRole) {
      return res.status(403).json({
        message: "Forbidden: Insufficient role",
      });
    }

    next();
  };
}
