import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.log(err);
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      errors: err.issues.map((e) => ({ field: e.path[0], message: e.message })),
    });
  }
  if (err.code === "P2002") {
    return res.status(400).json({
      success: false,
      message: "Username or UNFP ID already exists",
    });
  }
  res.status(500).json({ success: false, message: "Internal Server Error" });
}
