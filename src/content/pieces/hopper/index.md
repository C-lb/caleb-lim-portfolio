---
title: "Hopper - purchase catalogue that keeps score"
shortContext: "Log what you bought, where and for how much, and Hopper shows the price in your home currency at that day's rate, with retail in green when you paid less."
shortRole: "I built the Next.js app: the add-purchase form, the catalogue, the Leaflet map, the spend dashboard and the historical FX conversion."
shortOutcome: "Runs in demo mode on in-memory data. Wiring Supabase and deploying are next."
category: personal
order: 9
draft: false
year: "2026"
hero: "./hero.png"
video: "/videos/hopper.mp4"
videoPoster: "/videos/hopper.jpg"
deliverables: ["Purchase catalogue", "Historical FX conversion", "Map by purchase location", "Spend dashboard", "Demo mode"]
context: |
  Everyone has a drawer of receipts they never look at. Hopper is a
  purchase catalogue: log what you buy (item, brand, price, currency,
  condition, size and where you bought it) and it shows the price in your
  home currency at the FX rate on the day of purchase, not today's. Each
  card shows the retail price in green when you paid less and red when you
  paid more, and the dashboard totals what you spent and what you saved.
role: |
  I built it in Next.js with Tailwind: the add-purchase form, the catalogue
  cards, a Leaflet map of where things were bought, the spend dashboard
  with a home-currency selector, and the Supabase schema with row-level
  security so each user only sees their own rows. The interface is
  monochrome by design, black and white with the green and red retail
  colours as the only hue.
outcome: |
  The app runs in demo mode on an in-memory mock, with the catalogue, map
  and dashboard all working against the sample data. The backend is not
  wired yet and it is not deployed; connecting Supabase and putting it on
  Vercel are the next steps.
---
