---
title: "Resume Analyser - score, rewrite, match"
shortContext: "Upload a resume and get a score on five dimensions, before-and-after bullet rewrites, and a match against a job description showing which skills are missing."
shortRole: "I built the Next.js 16 app: parsing, the five-dimension evaluation, job matching, auth, and a deterministic mock AI provider."
shortOutcome: "Built and pushed. Runs end to end with zero API keys in mock mode; not deployed yet."
category: personal
order: 10
draft: false
year: "2026"
hero: "./hero.png"
video: "/videos/resume-analyser.mp4"
videoPoster: "/videos/resume-analyser.jpg"
deliverables: ["PDF, DOCX, TXT and MD parsing", "Five-dimension scoring", "Bullet rewrites", "Job description matching", "Zero-key mock mode"]
context: |
  Most resume feedback is vague. Resume Analyser takes one resume (PDF,
  DOCX, TXT, MD or pasted text), structures it into contact, summary,
  experience, education, skills and certifications, then scores it on five
  named dimensions: impact, clarity, skills coverage, structure and
  consistency. It lists strengths, prioritised issues with fixes, and
  before-and-after bullet rewrites, and matches the resume against a pasted
  job description or a seeded catalogue of jobs, showing matched and
  missing skills.
role: |
  I built it on Next.js 16 with React 19, Auth.js, Drizzle over libSQL and
  Zod validating both the parsed resume and the AI output. Structured
  generation goes through the Vercel AI SDK with a deterministic mock
  provider, so parsing, evaluation and matching all run with no external
  API calls when no key is set. A parse failure never loses the upload; the
  resume page offers a retry. Recruiters can flip the match around and rank
  every uploaded resume against one posting.
outcome: |
  Built and pushed, and it runs end to end with zero API keys in mock mode.
  It is not deployed yet; the Turso database and Vercel setup are the next
  steps.
---
