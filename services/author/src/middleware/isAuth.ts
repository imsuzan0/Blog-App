import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  image: string;
  instagram: string;
  facebook: string;
  github: string;
  linkedin: string;
  bio: string;
}

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
      res.status(401).json({ success: false, message: "Please Login" });
      return;
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SEC as string
    ) as JwtPayload;

    if (!decoded || !decoded.user) {
      res
        .status(401)
        .json({ success: false, message: "Please Login - Invalid Token" });
      return;
    }

    req.user = decoded.user;
    return next();
  } catch (error) {
    console.log("JWT verification error", error);
    res
      .status(401)
      .json({ success: false, message: "Please Login - JWT error" });
    return;
  }
};
