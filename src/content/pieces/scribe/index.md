---
title: "Scribe - live lecture transcription and notes"
shortContext: "A localhost app that records a lecture, transcribes it in 20-second chunks while it happens, and keeps a running Claude summary beside the transcript."
shortRole: "I built the recording pipeline, the local Whisper sidecar on the Mac's GPU, the course term lists, flags, exports and the Obsidian mirror."
shortOutcome: "In use for my own lectures. A real 31-minute session ran 128 chunks with none failed, and local transcription means nothing leaves the machine."
category: personal
order: 7
draft: false
year: "2026"
hero: "./hero.png"
video: "/videos/scribe.mp4"
videoPoster: "/videos/scribe.jpg"
deliverables: ["Chunked live transcription", "Local MLX Whisper sidecar", "Running Claude summary", "Course term lists", "Obsidian export"]
context: |
  Lecture recordings are useless if you never go back to them, and typing
  notes means not listening. Scribe is a localhost web app that records a
  lecture from the microphone, transcribes it in roughly 20-second chunks,
  and keeps a running Claude-written summary next to the live transcript.
  When you stop recording it writes full Markdown revision notes and
  mirrors them into an Obsidian vault.
role: |
  I built it end to end. Transcription runs on Groq's Whisper API until a
  local MLX Whisper sidecar on the Mac's GPU reports ready, then switches
  per chunk with no restart, so nothing leaves the machine and there is no
  per-hour charge. A course picker binds a term list into the Whisper bias
  prompt and corrects the transcript conservatively before a line is
  written. While recording, a Flag button (or the f key) marks the moment
  you are in, and the final notes get a section listing each flag with what
  was being said. Afterwards you can click a line to hear the exact chunk,
  double-click to correct it, and export the summary or transcript as
  Markdown, plain text, SRT, VTT or PDF. The server binds to localhost only
  and refuses cross-site state changes.
outcome: |
  In daily use for my own lectures. A real 31-minute session on 15
  September ran 128 chunks with zero failures at an estimated Groq cost of
  two cents, and the same session costs nothing on the local model. Every
  recording keeps its chunk audio, so a full re-transcription is always
  possible.
---
