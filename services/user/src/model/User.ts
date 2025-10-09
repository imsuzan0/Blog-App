import mongoose, { Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  image?: string;
  instagram: string;
  facebook: string;
  github: string;
  linkedin: string;
  bio: string;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    image: {
      type: String,
    },
    instagram: String,
    facebook: String,
    github: String,
    linkedin: String,
    bio: String,
  },
  { timestamps: true }
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;
