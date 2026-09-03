import express from "express";
import axios from "axios";
import { pool } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

const PAYDUNYA_HEADERS = {
  "Content-Type": "application/json",
  "PAYDUNYA-MASTER-KEY": process.env.PAYDUNYA_MASTER_KEY,
  "PAYDUNYA-PRIVATE-KEY": process.env.PAYDUNYA_PRIVATE_KEY,
  "PAYDUNYA-PUBLIC-KEY": process.env.PAYDUNYA_PUBLIC_KEY,
  "PAYDUNYA-TOKEN": process.env.PAYDUNYA_TOKEN,
};

const PAYDUNYA_BASE_URL =
  process.env.PAYDUNYA_MODE === "live"
    ? "https://app.paydunya.com/api/v1"
    : "https://app.paydunya.com/sandbox-api/v1";

router.post("/boost-status", requireAuth, async (req, res) => {
  const { statusId } = req.body;
  const amount = 3000;

  try {
    const invoicePayload = {
      invoice: {
        total_amount: amount,
        description: "Statut boosté MikeChat - visible 2 mois",
      },
      store: {
        name: "MikeChat",
      },
      actions: {
        return_url: `${process.env.PUBLIC_SERVER_URL}/payment-success`,
        cancel_url: `${process.env.PUBLIC_SERVER_URL}/payment-cancelled`,
        callback_url: `${process.env.PUBLIC_SERVER_URL}/api/payments/callback`,
      },
      custom_data: {
        user_id: req.user.id,
        status_id: statusId,
      },
    };

    const response = await axios.post(
      `${PAYDUNYA_BASE_URL}/checkout-invoice/create`,
      invoicePayload,
      { headers: PAYDUNYA_HEADERS }
    );

    if (response.data.response_code !== "00") {
      return res.status(400).json({ error: response.data.response_text });
    }

    await pool.query(
      `INSERT INTO payments (user_id, status_id, amount, paydunya_token, payment_status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [req.user.id, statusId, amount, response.data.token]
    );

    res.json({ paymentUrl: response.data.response_text });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Impossible de créer le paiement" });
  }
});

router.post("/callback", express.urlencoded({ extended: true }), async (req, res) => {
  try {
    const data = req.body.data ? JSON.parse(req.body.data) : req.body;
    const token = data.invoice?.token || data.token;
    const status = data.status;

    if (!token) return res.status(400).send("Token manquant");

    if (status === "completed") {
      const payment = await pool.query(
        "UPDATE payments SET payment_status = 'completed' WHERE paydunya_token = $1 RETURNING *",
        [token]
      );
      const p = payment.rows[0];
      if (p?.status_id) {
        await pool.query(
          "UPDATE statuses SET is_boosted = TRUE, expires_at = NOW() + INTERVAL '2 months' WHERE id = $1",
          [p.status_id]
        );
      }
    } else {
      await pool.query(
        "UPDATE payments SET payment_status = 'failed' WHERE paydunya_token = $1",
        [token]
      );
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur");
  }
});

export default router;
