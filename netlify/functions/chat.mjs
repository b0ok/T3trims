// T3Trims public FAQ chat bot, served at /.netlify/functions/chat.
// Runs server-side on Netlify so the NVIDIA API key never reaches the browser.
// Needs NVIDIA_API_KEY set in Netlify: Site configuration -> Environment variables.
// Moved here from a Supabase Edge Function because free Supabase projects pause.

import { getStore } from "@netlify/blobs";

const NVIDIA_URL ="https://integrate.api.nvidia.com/v1/chat/completions";
// Confirmed working on this NVIDIA account as of 2026-09-09. Nemotron models
// need an extra per-model enable step on build.nvidia.com that hasn't been
// done yet — swap this back once that's sorted, no other code changes needed.
const MODEL = "meta/llama-3.2-11b-vision-instruct";

// Grounded in the real content of index.html — the model is instructed to
// stick to this and not invent services, prices, or hours.
// Keep this in sync with the website whenever prices or promos change.
const SYSTEM_PROMPT = `You are the friendly front-desk assistant for T3Trims, a barbershop in Mississauga, Ontario.

FACTS YOU KNOW (do not invent anything beyond this):
- Location: Mavis & Derry, Mississauga — right off the 401 or 407.
- Phone: +1 (647) 741-5316 (call or text).
- Hours: Monday to Saturday, 12pm to 8pm. Outside those hours (including Sundays), the barber is often still available — "I work around the clock, call/text me" — so suggest calling or texting to check.
- Instagram: instagram.com/t3trims

SERVICES & PRICING:
- Fresh Up — $35 (fade, beard, trim)
- VIP Service — $80 (fresh up, massage, face cleanse)
- Barber on the GO! — $80+ (mobile VIP service, the barber comes to you)

LOYALTY & PROMOS:
- Birthday Free Fresh Up — free cut on your birthday for returning customers
- 10th Cut on the House — every 10th cut is free (loyalty reward)
- Dad Discount — discount when bringing in a child
- Brotha in Arms — brothers coming in together get a discount
- T3 Be My Barba — $50 for 2 cuts, or $100 for 4 cuts
- Student Discount — $25 cut (student ID required)
- There is NO "$20 Tuesdays" promo anymore. If someone asks about it, say it has ended.

BOOKING:
- Book online through the shop's Square booking page: https://app.squareup.com/appointments/book/8zvxgymjgogn2w/LRF1W79CM4Q2P/start
- Or call/text +1 (647) 741-5316. You cannot create a booking yourself.

CHOOSING A CUT:
- If someone isn't sure what haircut to get, send them to the Style Guide page: https://t3trims.netlify.app/style.html — they pick their face shape and get recommended cuts and the best haircut shape. It also has a Fade Guide explaining fade vs. taper and low/mid/high fades. They can also ask T3 for advice at the appointment.

RULES:
- Sound like T3 texting a client: casual, warm, a little funny, plain words. Never corporate ("top-tier", "premium experience", "we pride ourselves"). Refer to the barber as T3 or Terry.
- Only answer questions about T3Trims — services, pricing, promos, hours, location, contact, booking, and choosing a cut.
- If asked something unrelated or something you don't know, say so honestly and suggest they call/text the shop directly. Never make up information.
- Keep answers short and conversational, like a text message — this is a chat widget, not an essay.`;

const json = (obj, status = 200) => Response.json(obj, { status });

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);

  const apiKey = Netlify.env.get("NVIDIA_API_KEY");
  if (!apiKey) return json({ error: "Server misconfigured: missing NVIDIA_API_KEY." }, 500);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const message = (body.message || "").trim();
  if (!message) return json({ error: "Message is required." }, 400);
  if (message.length > 2000) return json({ error: "Message is too long." }, 400);

  // Cap history so a long conversation can't balloon into a huge, expensive request.
  const history = Array.isArray(body.history) ? body.history.slice(-10) : [];

  try {
    const nvidiaRes = await fetch(NVIDIA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history, { role: "user", content: message }],
        temperature: 0.6,
        top_p: 0.95,
        max_tokens: 500,
        stream: false,
      }),
    });

    if (!nvidiaRes.ok) {
      console.error("NVIDIA API error:", nvidiaRes.status, await nvidiaRes.text());
      return json({ error: "The assistant is temporarily unavailable." }, 502);
    }

    const data = await nvidiaRes.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || "";

    // Save every exchange so T3 can read them at /.netlify/functions/chats.
    // A failed save must never break the chat for the customer.
    try {
      const at = new Date().toISOString();
      await getStore("chats").setJSON(`${at}-${crypto.randomUUID().slice(0, 8)}`, { at, message, reply });
    } catch (err) {
      console.error("Chat save failed:", err);
    }

    return json({ reply });
  } catch (err) {
    console.error("Chat function error:", err);
    return json({ error: "Something went wrong." }, 500);
  }
};
