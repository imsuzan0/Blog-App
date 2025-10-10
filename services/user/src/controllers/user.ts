import jwt from "jsonwebtoken";
import User from "../model/User.js";
import TryCatch from "../utils/TryCatch.js";
import { AuthenticatedRequest } from "../middleware/isAuth.js";
import mongoose from "mongoose";
import getBuffer from "../utils/datauri.js";
import { v2 as cloudinary } from "cloudinary";

export const loginUser = TryCatch(async (req, res) => {
  const { email, name, image } = req.body;
  if (!email || !name) {
    return res.status(400).json({
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
  res
    .status(200)
    .json({ success: true, message: "Login successful", token, user });
});

export const myProfile = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;

  res.json({ success: true, user });
});

export const getUserprofile = TryCatch(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid user id" });
  }
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  res.json({ success: true, user });
});

export const updateUser = TryCatch(async (req: AuthenticatedRequest, res) => {
  const { name, instagram, facebook, linkedin, github, bio } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      name,
      instagram,
      facebook,
      linkedin,
      github,
      bio,
    },
    { new: true }
  );

  const token = jwt.sign({ user }, process.env.JWT_SEC as string, {
    expiresIn: "7d",
  });

  res.json({ success: true, message: "Profile updated", user, token });
});

export const updateProfilePic = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const file = req.file;
    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide a file" });
    }
    const fileBuffer = getBuffer(file);
    if (!fileBuffer || !fileBuffer.content) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
    //cloudinary upload
    const cloud = await cloudinary.uploader.upload(fileBuffer.content, {
      folder: "Blog:profile_pics",
    });

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      { image: cloud.secure_url },
      { new: true }
    );

    const token = jwt.sign({ user }, process.env.JWT_SEC as string, {
      expiresIn: "7d",
    });

    res.json({
      success: true,
      message: "Profile picture updated",
      user,
      token,
    });
  }
);
