import { Request, Response, NextFunction, RequestHandler } from "express";

const TryCatch = (handler: RequestHandler): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: `Error: ${error.message}` });
    }
  };
};

export default TryCatch;
