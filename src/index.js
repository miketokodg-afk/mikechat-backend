import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import paymentRoutes from "./routes/payments.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/", (req, res) => res.send("MikeChat backend en marche"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`MikeChat backend démarré sur le port ${PORT}`));
