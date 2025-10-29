import { Request, Response } from "express";
import TryCatch from "../utils/TryCatch.js";
import { AuthenticatedRequest } from "../middleware/isAuth.js";
import getBuffer from "../utils/datauri.js";
import { v2 as cloudinary } from "cloudinary";
import { sql } from "../utils/db.js";
import { invalidateCacheJob } from "../utils/rabbitmq.js";
import { GoogleGenAI } from "@google/genai";

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

export const aiTitleResponse = TryCatch(async (req, res) => {
  const { text } = req.body;

  const prompt = `Correct the grammer of the following blog title and return only the correct title without any additional text, formating or symbols: ${text}`;

  let result;

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  async function main() {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let rawText = response.text;

    if (!rawText) {
      return res.status(400).json({ message: "Something went wrong" });
    }

    result = rawText
      .replace(/\*\*/g, "")
      .replace(/[\r\n]+/g, "")
      .replace(/[*_`~]/g, "")
      .trim();
  }

  await main();
  res.json({ result });
});

export const aiDescriptionResponse = TryCatch(async (req, res) => {
  const { title, description } = req.body;

  const prompt =
    description === ""
      ? `Generate only one short blog description based onthis title: "${title}". Your response must be only one sentence, strictly under 30 words, with no options, nogreetings, and no extra text. Do not explain. Do not say 'here is'. Just return the description only.`
      : `Fix thegrammar in the following blog description and return only the corrected sentence. Do not add anything else:"${description}"`;

  let result;

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  async function main() {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let rawText = response.text;

    if (!rawText) {
      return res.status(400).json({ message: "Something went wrong" });
    }

    result = rawText
      .replace(/\*\*/g, "")
      .replace(/[\r\n]+/g, "")
      .replace(/[*_`~]/g, "")
      .trim();
  }

  await main();
  res.json({ result });
});

export const aiBlogResponse = async (req, res) => {
  try {
    console.log("Incoming body:", req.body);
    const { blog } = req.body;

    if (!blog) {
      return res.status(400).json({ message: "Please provide blog" });
    }

    const prompt = `You will act as a grammar correction engine. I will provide you with blog content 
in rich HTML format (from Jodit Editor). Do not generate or rewrite the content with new ideas. 
Only correct grammatical, punctuation, and spelling errors while preserving all HTML tags and formatting. 
Maintain inline styles, image tags, line breaks, and structural tags exactly as they are. 
Return the full corrected HTML string as output.`;

    const fullMessage = `${prompt}\n\n${blog}`;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: fullMessage }] }],
    });

    const rawText = response.text;
    if (!rawText) {
      return res.status(500).json({ message: "No response from AI" });
    }

    const cleanedHtml = rawText
      .replace(/^(html|```html|```)\n?/i, "")
      .replace(/```$/i, "")
      .replace(/\*\*/g, "")
      .replace(/[\r\n]+/g, "")
      .replace(/[*_`~]/g, "")
      .trim();

    res.status(200).json({ html: cleanedHtml });
  } catch (error) {
    console.error("AI Blog Response Error:", error);
    res.status(500).json({
      message: "AI generation failed",
      error: error.message,
    });
  }
};
