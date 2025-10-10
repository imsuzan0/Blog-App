import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { IUser } from "../model/User.js";

export interface AuthenticatedRequest extends Request {
  user?: IUser | null;
}

export const isAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res
        .status(401)
        .json({ success: false, message: `Please Login - No Auth Header` });
      return;
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      res
        .status(401)
        .json({ success: false, message: `Please login - No Token` });
    }

    const decodeValue = jwt.verify(
      token,
      process.env.JWT_SEC as string
    ) as JwtPayload;

    if (!decodeValue || !decodeValue.user) {
      res
        .status(401)
        .json({ success: false, message: `Please login - Invalid Token` });
      return;
    }

    req.user = decodeValue.user;
    next();
  } catch (error) {
    console.log("JWT verification error: ", error);
    res
      .status(401)
      .json({ success: false, message: `Please login - JWT error` });
  }
};
