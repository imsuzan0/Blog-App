import express from "express";
import dotenv from "dotenv";
import blogRoutes from "./routes/blog.js";
import cors from "cors";
import Redis from "ioredis";
import { startCacheConsumer } from "./utils/consumer.js";

dotenv.config();

export const redisClient = new Redis(process.env.REDIS_URL);

const app = express();

startCacheConsumer();

const PORT = process.env.PORT || 5002;

app.use(express.json());

app.use(cors());

app.use("/api/v1", blogRoutes);

app.listen(PORT, () => {
  console.log(`Blog service is running on port ${PORT}`);
});
