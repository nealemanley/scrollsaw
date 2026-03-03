const Stripe = require("stripe");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const keys = {
    stripe: (process.env.STRIPE_SECRET_KEY || "").slice(0, 12),
    price: (process.env.STRIPE_PRICE_ID || "").slice(0, 12),
    supabase_url: (process.env.SUPABASE_URL || "").slice(0, 12),
    supabase_svc: (process.env.SUPABASE_SERVICE_KEY || "").slice(0, 12),
  };

  return res.status(200).json({ debug: keys });
};
