import express from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db/pool.js";

const router = express.Router();

// Connexion / inscription simplifiée par numéro de téléphone.
// Pour la production, ajoute un vrai code SMS de vérification (ex: via un service comme Twilio).
router.post("/login", async (req, res) => {
  const { phone, name } = req.body;
  if (!phone) return res.status(400).json({ error: "Numéro de téléphone requis" });

  try {
    let result = await pool.query("SELECT * FROM users WHERE phone = $1", [phone]);
    let user = result.rows[0];

    if (!user) {
      const insert = await pool.query(
        "INSERT INTO users (phone, name) VALUES ($1, $2) RETURNING *",
        [phone, name || "Nouvel utilisateur"]
      );
      user = insert.rows[0];
    }

    const token = jwt.sign({ id: user.id, phone: user.phone }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.json({ token, user: { id: user.id, phone: user.phone, name: user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
