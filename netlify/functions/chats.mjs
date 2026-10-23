// Private viewer for saved chat bot conversations, newest first.
// Open /.netlify/functions/chats?key=YOUR_PASSWORD
// Needs CHATS_PASSWORD set in Netlify: Site configuration -> Environment variables.
import { getStore } from "@netlify/blobs";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export default async (req) => {
  const password = Netlify.env.get("CHATS_PASSWORD");
  if (!password || new URL(req.url).searchParams.get("key") !== password) {
    return new Response("Not allowed.", { status: 401 });
  }

  // ponytail: loads every chat on each view; add paging if this grows past a few thousand.
  const store = getStore("chats");
  const { blobs } = await store.list();
  const chats = await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })));
  chats.sort((a, b) => b.at.localeCompare(a.at));

  const rows = chats.map((c) => `
    <div class="chat">
      <time>${esc(new Date(c.at).toLocaleString("en-CA", { timeZone: "America/Toronto" }))}</time>
      <p><b>Customer:</b> ${esc(c.message)}</p>
      <p><b>Bot:</b> ${esc(c.reply)}</p>
    </div>`).join("");

  return new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>T3Trims chats</title>
<style>body{font:16px system-ui;max-width:700px;margin:0 auto;padding:16px}.chat{border-bottom:1px solid #ccc;padding:8px 0}time{color:#777;font-size:14px}p{margin:4px 0;white-space:pre-wrap}</style>
<h1>Chats (${chats.length})</h1>${rows || "<p>No chats yet.</p>"}`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
};
