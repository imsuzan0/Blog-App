import express from "express";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import userRoutes from "./routes/user.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json());

app.use("/api/v1/user", userRoutes);

app.get("/", (req, res) => {
  res.send("User service is running");
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`User service is running on port ${PORT}`);
  });
});
