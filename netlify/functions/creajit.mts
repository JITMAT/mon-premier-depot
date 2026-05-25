import type { Context, Config } from "@netlify/functions";

// CREAJIT MES - Proxy vers l'API CreaJit (creajit.ma)
// GET /api/creajit/orders -> liste des commandes réelles
// Route /api/creajit/* puis /api/*
// NOTE: reconstruire la vraie logique de proxy/auth vers creajit.ma/admin/orders
// Login API CreaJit observé: driss@salle91.com

const CREAJIT_API = "https://creajit.ma/api";

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const sub = url.pathname.replace(/^\/api\/(creajit\/)?/, "");

  if (sub === "orders" && req.method === "GET") {
    // TODO: proxy authentifié vers creajit.ma/admin/orders
    // Retourne le format observé:
    // [{ref, cl, tel, com, uuid, tot, sol, nb, late, j, liv, status, notes, articles:[...]}]
    try {
      const r = await fetch(`${CREAJIT_API}/orders`, {
        headers: { "Authorization": `Bearer ${Netlify.env.get("CREAJIT_TOKEN") || ""}` }
      });
      const data = await r.json();
      return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
    } catch (e) {
      return new Response(JSON.stringify({ error: "CreaJit API error" }), { status: 502, headers: { "Content-Type": "application/json" } });
    }
  }
  return new Response(JSON.stringify({ error: "Route not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
};

export const config: Config = { path: "/api/creajit/*" };
