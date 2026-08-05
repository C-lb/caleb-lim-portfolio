---
title: "nano - pocket audio clip library"
shortContext: "A pocket library for audio clips: paste a link, the audio is ripped and trimmed on entry, and it lands in a real player."
shortRole: "Built the whole thing solo, from the SwiftUI app to the self-hosted ripper it pulls audio through."
shortOutcome: "On TestFlight and in daily use, running entirely on free tiers."
category: personal
order: 6
draft: false
year: "2026"
hero: "./hero.png"
gallery: ["./gallery-01.png"]
deliverables: ["iOS app on TestFlight", "Link ripping via self-hosted cobalt", "Share extension", "Supabase backend"]
context: |
  Song snippets, voice notes, and audio from links end up scattered
  across chats and camera rolls with no player built for them. nano
  gives them a home: paste a YouTube, TikTok, or SoundCloud link (or
  share it straight from the app), the audio is ripped and trimmed on
  entry, and the clip lands in a library with albums, covers, and a
  player that treats a ten-second clip as a first-class track.
role: |
  Built the whole thing solo: the SwiftUI app and share extension, the
  trim flow with typed timecode entry, the Supabase backend with
  row-level security, and the self-hosted cobalt ripper it pulls audio
  through. Playback runs through a custom engine with lock screen and
  Dynamic Island artwork, a spinning vinyl mode, and a synth orb that
  reacts to the live amplitude of the track.
outcome: |
  On TestFlight and in daily use, with rips verified end to end across
  YouTube, TikTok, and SoundCloud. About 150 automated tests cover the
  core, and the whole service side runs on free tiers: zero server
  code, zero monthly cost.
---
