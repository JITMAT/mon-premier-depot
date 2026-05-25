import type { Context } from "@netlify/functions";

// CREAJIT MES - Fonction d'authentification
// Comportement observé en production :
// POST /api/auth/login {email, password} -> {token, user:{id,name,email,role,roleLabel,roleColor,tel}}
// Route /api/auth/* (capture les sous-chemins)

const USERS = [
  { id:"u1", email:"driss@creajit.ma",  pass:"Drisspro@1981.*", name:"Driss Aarab",     role:"admin",      roleLabel:"Administrateur", roleColor:"#C4714F", tel:"+33602088048" },
  { id:"u2", email:"hanane@creajit.ma", pass:"hanane2024",      name:"Hanane Ajdi",      role:"production", roleLabel:"Production",     roleColor:"#3b82f6", tel:"+212602434387" },
  { id:"u3", email:"kenza@creajit.ma",  pass:"kenza2024",       name:"Kenza Mokhantar",  role:"commercial", roleLabel:"Commercial",     roleColor:"#2ECC71", tel:"+212626704669" },
  { id:"u4", email:"ikram@creajit.ma",  pass:"ikram2024",       name:"Ikram Benaddi",    role:"commercial", roleLabel:"Commercial",     roleColor:"#2ECC71", tel:"+212711303969" },
  { id:"u5", email:"laila@creajit.ma",  pass:"laila2024",       name:"Laila Boudil",     role:"commercial", roleLabel:"Commercial",     roleColor:"#2ECC71", tel:"+212671171780" },
  { id:"u6", email:"fatima@creajit.ma", pass:"fatima2024",      name:"Fatima Ezzahra",   role:"livraison",  roleLabel:"Livraison",      roleColor:"#EAB308", tel:"+212626069989" },
  { id:"u7", email:"moumen@creajit.ma", pass:"moumen2024",      name:"Mohamed Moumen",   role:"magasin",    roleLabel:"Magasin",        roleColor:"#6b7280", tel:"+212605958012" },
];

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  if (url.pathname.endsWith("/login") && req.method === "POST") {
    const { email, password } = await req.json();
    const u = USERS.find(x => x.email === email && x.pass === password);
    if (!u) return new Response(JSON.stringify({ error: "Email ou mot de passe incorrect" }), { status: 401, headers: { "Content-Type": "application/json" } });
    const payload = { id: u.id, role: u.role, name: u.name, exp: Date.now() + 7*24*3600*1000 };
    const token = Buffer.from(JSON.stringify(payload)).toString("base64");
    const { pass, ...user } = u;
    return new Response(JSON.stringify({ token, user }), { headers: { "Content-Type": "application/json" } });
  }
  return new Response(JSON.stringify({ error: "Route not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
};

export const config: Config = { path: "/api/auth/*" };
import type { Config } from "@netlify/functions";
