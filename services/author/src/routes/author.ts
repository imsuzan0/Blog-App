import express from "express";
import { createBlog, deleteBlog, updateBlog } from "../controllers/author.js";
import { isAuth } from "../middleware/isAuth.js";
import uploadFile from "../middleware/multer.js";

const router = express.Router();

router.post("/blog/new", isAuth, uploadFile,createBlog);
router.post("/blog/:id", isAuth, uploadFile,updateBlog);
router.delete("/blog/:id", isAuth,deleteBlog);

export default router;
