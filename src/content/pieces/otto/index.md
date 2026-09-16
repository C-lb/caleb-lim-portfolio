---
title: "Otto - staff app for valet parking"
shortContext: "An internal iOS app for a valet business: a live board of cars on site, a car file for every plate, and plate search that works in a basement with no signal."
shortRole: "I built the domain core, the sync layer and the SwiftUI app on top, event-sourced and offline-first."
shortOutcome: "Waves 1 and 2 of Custody Core are built, with pgTAP and Swift test suites sharing one set of contract vectors."
category: personal
order: 8
draft: false
year: "2026"
hero: "./hero.png"
video: "/videos/otto.mp4"
videoPoster: "/videos/otto.jpg"
deliverables: ["Native SwiftUI iOS app", "Offline-first local store", "Event-sourced sync", "Plate keyboard search", "Supabase with RLS"]
context: |
  Valets work in basement carparks, and basements have no signal. Otto is
  the internal staff app for a valet parking and drive-me-home business,
  used by valets, leads, keyholders, recovery drivers and client-liaison
  staff at fixed venues and ad-hoc events. The platform is planned as eight
  modules; the first sub-project, Custody Core, covers receiving a car,
  parking it and recording its location, retrieving it, the live board of
  cars on site, and the key chain of custody.
role: |
  I built Custody Core so far: a domain core in Swift with no I/O (total
  fold, plate matching, file numbering, canonical hashing), a local SQLite
  store, a sync layer with an outbox, retry and quarantine, and the SwiftUI
  app on top. It is offline-first because the board has to tell the truth
  with no radio, and event-sourced so the audit trail is a byproduct rather
  than a feature. The board header says how old its data is, plate search
  runs on a dedicated keyboard with no autocorrect and explains how each
  result matched, and a sync health screen shows which events were rejected
  and why. Supabase holds the schema, row-level security and the sync RPCs,
  with a frozen sync contract for the later Android port.
outcome: |
  Waves 1 and 2 of Custody Core are built: a valet can sign in on a
  registered device, see the live board, receive and park a car, open its
  car file, search by plate and check sync health. Shared contract vectors
  are read by both the Swift tests and the pgTAP suites, and a simulator
  smoke-test suite runs against a local seed.
---
