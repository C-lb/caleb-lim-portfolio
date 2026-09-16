---
title: "lebbot - Claude Code from Telegram"
shortContext: "My personal Telegram bot that fronts Claude Code: I get Claude with sessions and repos, strangers get a wall, and guests get three commands."
shortRole: "I built the tiering on top of a Python Telegram bot: the guest menu, the verbatim relay in both directions, and the launchd service that keeps it up."
shortOutcome: "Running on my Mac as a launchd service. Guests never touch Claude, and I can answer them from Telegram without leaving the chat."
category: personal
order: 11
draft: false
year: "2026"
hero: "./hero.png"
video: "/videos/lebbot.mp4"
videoPoster: "/videos/lebbot.jpg"
deliverables: ["Telegram front end for Claude Code", "Owner, guest and stranger tiers", "Verbatim message relay", "launchd service"]
context: |
  I wanted Claude Code on my phone without exposing it to whoever finds the
  bot. lebbot is a Telegram bot with three tiers. As the owner I get Claude
  Code with sessions that resume per project, repos and tools. A stranger
  who messages it gets a wall and their ID to pass on. A guest gets exactly
  three commands (start, free, msg) and none of them reach Claude; the bot
  passes their message to me and, in its own words, "Passed along. Didn't
  come from me."
role: |
  I built it on a Python Telegram bot that wraps the Claude Agent SDK with
  python-telegram-bot, and added the parts that make it mine: a middleware
  chain (security, auth, rate limit) that sorts every message into a tier
  before anything else runs, the guest command set and its replies, the
  notice I get when a guest writes in, and a reply command that relays my
  text back to them verbatim with no rewording. It runs as a launchd
  service on my Mac so it survives reboots.
outcome: |
  In daily use. I run Claude Code sessions from Telegram, a handful of
  friends can leave me messages through the bot, and I can answer them
  from the same chat. No API keys, chat IDs or names appear anywhere in
  the bot's replies.
---
