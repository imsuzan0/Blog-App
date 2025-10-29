import axios from "axios";
import { sql } from "../utils/db.js";
import TryCatch from "../utils/TryCatch.js";
import { redisClient } from "../server.js";

export const getAllBlogs = TryCatch(async (req, res) => {
  const { searchQuery = "", category = "" } = req.query;

  const cacheKey = `blogs:${searchQuery}:${category}`;
  const cachedData = await redisClient.get(cacheKey);

  if (cachedData) {
    console.log("Serving blogs from redis client");
    return res.status(200).json(JSON.parse(cachedData));
  }

  let blogs;

  if (searchQuery && category) {
    blogs = await sql`SELECT * FROM blogs WHERE (title ILIKE ${
      "%" + searchQuery + "%"
    } OR description ILIKE  ${
      "%" + searchQuery + "%"
    }) AND category = ${category} ORDER BY created_at DESC`;
  } else if (searchQuery) {
    blogs = await sql`SELECT * FROM blogs WHERE title ILIKE ${
      "%" + searchQuery + "%"
    } OR description ILIKE  ${
      "%" + searchQuery + "%"
    } ORDER BY created_at DESC`;
  } else if (category) {
    blogs =
      await sql`SELECT * FROM blogs WHERE category=${category} ORDER BY created_at DESC`;
  } else {
    blogs = await sql`SELECT * FROM blogs ORDER BY created_at DESC`;
  }
  if (blogs.length === 0) {
    return res.status(200).json({ success: false, message: "No blogs found",blogs:[] });
  }

  console.log("Serving blogs from database");

  await redisClient.set(cacheKey, JSON.stringify(blogs), "EX", 3600);

  res
    .status(200)
    .json(blogs);
});

export const getSingleBlog = TryCatch(async (req, res) => {
  const { id } = req.params;

  const cacheKey = `blog:${id}`;
  const cachedData = await redisClient.get(cacheKey);

  if (cachedData) {
    console.log("Serving blog from redis client");
    return res.status(200).json(JSON.parse(cachedData));
  }

  // Fetch the blog by ID
  const blog = await sql`SELECT * FROM blogs WHERE id = ${id}`;

  if (blog.length === 0) {
    return res.status(404).json({ success: false, message: "No blog found" });
  }

  // Fetch author info from user service
  let author = null;
  try {
    const response: any = await axios.get(
      `${process.env.USER_SERVICE}/api/v1/user/${blog[0].author}`
    );
    author = response.data.user; // Only the data part
  } catch (error: any) {
    // If the user service fails, just return null or a default value
    console.error("Error fetching author:", error.message);
  }

  console.log("Serving blog from database");

  const responseData = {
    success: true,
    message: "Blog fetched successfully",
    blog: blog[0],
    author,
  };

  await redisClient.set(cacheKey, JSON.stringify(responseData), "EX", 1800);

  res.status(200).json(responseData);
});
