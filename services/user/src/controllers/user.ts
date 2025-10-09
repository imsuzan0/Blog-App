import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../model/User.js";

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, name, image  } = req.body;
    if (!email || !name ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Please provide all required fields",
        });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email, name, image });
    }
    const token = jwt.sign({ user }, process.env.JWT_SEC as string, {
      expiresIn: "7d",
    });
    res.status(200).json({ success: true, message: "Login successful", token,user });
  } catch (error: any) {
    res
      .status(500)
      .json({ success: false, message: `Server error:${error.message}` });
  }
};
