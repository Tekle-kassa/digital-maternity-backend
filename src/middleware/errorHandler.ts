// import { Request, Response, NextFunction } from "express";
// import { ZodError } from "zod";
// export function errorHandler(
//   err: any,
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) {
//   console.log(err);
//   if (err instanceof ZodError) {
//     return res.status(400).json({
//       success: false,
//       errors: err.issues.map((e) => ({ field: e.path[0], message: e.message })),
//     });
//   }
//   if (err.code === "P2002") {
//     return res.status(400).json({
//       success: false,
//       message: "Username or UNFP ID already exists",
//     });
//   }
//   res.status(500).json({ success: false, message: "Internal Server Error" });
// }

import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export function globalErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // DEVELOPMENT MODE → return full debug info
  if (process.env.NODE_ENV !== "production") {
    console.error("ERROR:", err);

    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  }

  // PRODUCTION MODE

  // If the error is not operational, don't leak details
  if (!err.isOperational) {
    console.error("UNEXPECTED ERROR:", err);

    return res.status(500).json({
      status: "error",
      message: "Something went wrong. Please try again later.",
    });
  }

  // If operational → return clean message
  return res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
}
