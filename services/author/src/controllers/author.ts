import { Request, Response } from "express";
import TryCatch from "../utils/TryCatch.js";
import { AuthenticatedRequest } from "../middleware/isAuth.js";
import getBuffer from "../utils/datauri.js";
import { v2 as cloudinary } from "cloudinary";
import { sql } from "../utils/db.js";
import { invalidateCacheJob } from "../utils/rabbitmq.js";

export const createBlog = TryCatch(async (req: AuthenticatedRequest, res) => {
  const { title, description, blogcontent, category } = req.body;

  if (!title || !description || !blogcontent || !category) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const file = req.file;
  let imageUrl =
    "https://thumbs.dreamstime.com/b/no-image-available-icon-flat-vector-no-image-available-icon-flat-vector-illustration-132482953.jpg";

  if (file) {
    const fileBuffer = getBuffer(file);

    if (!fileBuffer || !fileBuffer.content) {
      return res.status(400).json({ message: "File is invalid" });
    }

    const cloud = await cloudinary.uploader.upload(fileBuffer.content, {
      folder: "blogs",
    });

    imageUrl = cloud.secure_url;
  }

  const result = await sql`INSERT INTO blogs
    (title, description, image, blogcontent, category, author)
    VALUES
    (${title}, ${description}, ${imageUrl}, ${blogcontent}, ${category}, ${req.user?._id})
    RETURNING *`;

  await invalidateCacheJob(["blogs:*"]);

  res
    .status(201)
    .json({ message: "Blog created successfully", blog: result[0] });
});

export const updateBlog = TryCatch(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { title, description, blogcontent, category } = req.body;
  const file = req.file;

  const blog =
    await sql`SELECT * FROM blogs WHERE id=${id} AND author=${req.user?._id}`;
  if (blog.length === 0) {
    return res.status(404).json({ success: false, message: "Blog not found" });
  }

  let imageUrl = blog[0].image; // keep old image by default

  if (file !== undefined) {
    const fileBuffer = getBuffer(file);
    if (!fileBuffer || !fileBuffer.content) {
      return res.status(400).json({ message: "File is invalid" });
    }

    const cloud = await cloudinary.uploader.upload(fileBuffer.content, {
      folder: "blogs",
    });
    imageUrl = cloud.secure_url;

    // destroy old image
    const publicId = blog[0].image.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(publicId);
  }

  const updatedBlog = await sql`UPDATE blogs
    SET title=${title || blog[0].title},
        description=${description || blog[0].description},
        image=${imageUrl},
        blogcontent=${blogcontent || blog[0].blogcontent},
        category=${category || blog[0].category}
    WHERE id=${id} AND author=${req.user?._id}
    RETURNING *`;

  await invalidateCacheJob(["blogs:*", `blog:${id}`]);

  res.status(200).json({
    success: true,
    message: "Blog updated successfully",
    blog: updatedBlog[0],
  });
});

export const deleteBlog = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const blog =
      await sql`SELECT * FROM blogs WHERE id=${id} AND author=${req.user?._id} `;
    if (blog.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }
    if (blog[0].author !== req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "You are not authorized to delete this blog",
      });
    }
    //destory image from cloudinary
    const publicId = blog[0].image.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(publicId);
    await sql`DELETE FROM blogs WHERE id=${id} AND author=${req.user?._id}`;
    await sql`DELETE FROM savedblogs WHERE blogid=${id}`;
    await sql`DELETE FROM comments WHERE blogid=${id}`;

    await invalidateCacheJob(["blogs:*", `blog:${id}`]);

    res
      .status(200)
      .json({ success: true, message: "Blog deleted successfully" });
  }
);
