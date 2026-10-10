# T3Trims

The website for my barbershop in Mississauga, with an AI chat receptionist that answers clients while I'm cutting.

**Live:** [t3trims.netlify.app](https://t3trims.netlify.app)

![T3Trims homepage](https://raw.githubusercontent.com/b0ok/portfolio/main/images/t3trims.webp)

## What it does

- **Booking:** "Book Now" opens the shop's Square booking calendar.
- **Services and promos:** Fresh Up, VIP, mobile "Barber on the GO!", loyalty deals and the student cut.
- **Style Guide** (`style.html`): pick your face shape to get recommended cuts, plus a fade guide (fade vs. taper, low/mid/high).
- **Grooming Tips** (`tips.html`).
- **AI receptionist:** a chat bubble on every page that answers questions about prices, promos, hours, location and booking, around the clock.

![The AI receptionist answering "How much is a fade?"](https://raw.githubusercontent.com/b0ok/portfolio/main/images/t3trims-chat.webp)

## How the AI receptionist works

The chat calls a Netlify Function at `/.netlify/functions/chat` ([`netlify/functions/chat.mjs`](netlify/functions/chat.mjs)). It sends the client's message to an LLM through NVIDIA's API, together with a fact sheet about the shop (the `SYSTEM_PROMPT`).

- The model is told to answer only from that fact sheet, say "I don't know" instead of guessing, and point people to call or text.
- It never books anything itself; it links to the Square booking page.
- The API key stays on the server and never reaches the browser.

**When prices, promos or hours change on the site, update `SYSTEM_PROMPT` in `chat.mjs` too**, or the bot will quote old info.

## Tech

- Plain HTML, CSS and JavaScript. No framework, no build step.
- Hosted on Netlify, which auto-deploys on every push to `main`.
- Netlify Functions for the chat backend.
- Share-preview images, canonical URLs, `sitemap.xml` and `robots.txt` for search engines.

## Run it locally

```bash
npm install -g netlify-cli
netlify dev
```

The chat needs an `NVIDIA_API_KEY` environment variable. Set it in Netlify under Site configuration → Environment variables, or in a local `.env` file for `netlify dev`. The rest of the site works without it.

## Structure

```
index.html            Home: about, booking, services, gallery, contact
style.html            Style Guide: face shapes, haircut shapes, fade guide
tips.html             Grooming tips
netlify/functions/    chat.mjs (AI receptionist backend)
images/               Banner, gallery, team and share-preview images
sitemap.xml, robots.txt
```

## About

Built by Terry "T3" Nguyen, a barber who builds software. More at [t3rrynguy3n.netlify.app](https://t3rrynguy3n.netlify.app), or read [how I built the AI receptionist](https://t3rrynguy3n.netlify.app/posts/ai-receptionist.html).
