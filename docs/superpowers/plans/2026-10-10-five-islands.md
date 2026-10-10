# Five Islands Implementation Plan
> Execute inline using superpowers:executing-plans; approved design and instruction to continue are in the conversation.
Goal: deliver five illustrated islands, fifteen curriculum-aligned core missions, and an optional C6 scene.
Architecture: versioned mission catalog and reducers preserve legacy sessions; shared evaluators run client/server. DOM/CSS scenic layers and controls use the approved assets and accessible interactions. Manual rubric review is teacher-only.
Tech Stack: Vite, DOM/CSS, Fastify, Postgres, Vitest, Playwright.
Spec: ../specs/2026-10-10-five-islands.md

## Global constraints
15 core; 10 C3/L2, 4 C4/L3, 1 C5/L3; one C6 boss; strict unrounded >95; no boss grade impact; no history deletion.
## Review focus
- Historic mission IDs must not count towards v2 or crash exports/import.
- Forged grade events must not be accepted from students.
- Exactly 95 or missing/pending work must not unlock boss.
- Offline refresh must retain drafts and later adopt teacher reviews.
- Mobile controls, reduced motion and scene loading must remain usable.

## Task 1: versioned assessment
Files: shared/missions, progress, assessment, evaluators; legacy copies. Tests: v2.test.js, existing legacy tests.
- [x] RED tests for distribution, strict threshold, legacy separation, score independence.
- [x] Implement versioned catalog/reducer and preserve legacy functions.
- [x] GREEN unit suite.
## Task 2: interactive curriculum and review
Files: shared/v2 evaluator; client/ui; server/routes/teacher and progress; import.
- [x] RED tests for correct and incorrect answers, boundary tests, incomplete evidence and teacher authorization.
- [x] Implement objective activities plus C5/C6 pending rubric flow.
- [x] GREEN unit/API suite.
## Task 3: illustrated experience
Files: client/main, styles, world; public/game-assets; vite offline cache.
- [x] Add asset manifest and deterministic WebP export.
- [x] Build five-island map, scene UI, ending and boss; mobile and keyboard controls.
- [x] Browser tests for navigation, assessment and responsive layout.
## Task 4: verification
- [x] npm test, npm run build, npm run test:browser.
- [x] Fresh whole-branch review; fix important findings and verify regressions.
- [x] Record outcomes and limitations; commit work and prepare draft PR, no production publish.
