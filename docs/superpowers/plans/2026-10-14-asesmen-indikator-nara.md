# Asesmen indikator dan Nara Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development to implement task-by-task. Track steps with checkboxes.

**Goal:** Penilaian berbukti per indikator oleh tiga model, Nara konkret maksimal 400 karakter, XP tanpa penalti, dan rapor kelas per TP.

**Architecture:** Pertahankan event replay dan dokumen sesi Postgres. Pisahkan penyelesaian aktivitas, asesmen indikator, serta XP. Modul shared menyediakan rubrik, agregasi dan kompatibilitas; server memvalidasi bukti dan mengorkestrasi provider; UI memakai hasil yang sama.

**Tech Stack:** JavaScript ESM, Fastify, pg, Vite, Vitest, Playwright; tanpa dependensi baru.

**Spec:** `docs/superpowers/specs/2026-10-14-asesmen-indikator-nara-design.md`

## Global Constraints
- Maksimum Nara 400 karakter Unicode termasuk spasi, tanpa minimum; 300–400 jika perlu bantuan panjang.
- 100 XP sekali per misi inti selesai; ulang, salah, waktu, petunjuk tanpa penalti.
- Rubrik 1–4, ambang awal 3; belum cukup bukti tanpa skor buatan.
- Tiga provider independen per submission; OpenRouter tetap model gratis; tidak kirim identitas/kredensial.
- Arsip skor lama dipertahankan; tidak menurunkan indikator dari angka total historis.
- Guru dapat mengoreksi dengan audit; model gagal tidak menghasilkan nol.

## Review Focus
- Dua permintaan penilaian bersamaan tidak menggandakan provider/XP (Task 3).
- Hasil model terlambat tidak menimpa koreksi guru (Task 3).
- Perangkat offline/import tidak dapat menyisipkan nilai atau bukti mandiri palsu (Tasks 3, 4).
- Rapor dengan murid tanpa sesi tetap memakai denominator seluruh kelas (Task 6).
- Unicode, HTML dan pesan panjang tetap aman serta terbaca mobile (Task 5).

## Task 1: Rubrik dan soal variasi seluruh misi
**Files:** Create `src/shared/indicator-rubrics.js`, `src/shared/mastery-checks.js`, `tests/unit/indicator-rubrics.test.js`. Modify `src/shared/mission-alignment.js`, `src/shared/missions.js`.
**Interfaces:** `getIndicatorRubric(missionId)` returns `{version, indicators:[{id,label,descriptors,tpLinks,requiredEvidence}]}`; `getMasteryCheck(missionId, indicatorId)` returns `{id,version,prompt,expectedEvidence}`. Include all 15 core missions and boss. Explicitly mark prerequisite/partial/supporting evidence; do not invent TP IDs beyond existing ATP references.
- [ ] Write catalog tests: every mission resolves rubrics and checks; each descriptor has levels 1–4; IDs unique; every TP link has direct/partial/supporting classification; boss mapped; prerequisites never declare full TP coverage.
- [ ] Run `npx vitest run tests/unit/indicator-rubrics.test.js` and confirm failure before implementation.
- [ ] Implement curated criteria based on mission rules, action types and teacher guide; written reasoning never inferred from multiple-choice clicks.
- [ ] Run same tests and catalog/clarity tests; expect PASS. Commit task files.

## Task 2: Validated indicator grades and three-provider consensus
**Files:** Create `src/shared/indicator-assessment.js`, `src/server/ai-consensus.js`, `tests/unit/ai-consensus.test.js`. Modify `src/server/ai-grader.js`, `tests/unit/ai-fallback.test.js`.
**Interfaces:** `validateIndicatorGrade(rubric, evidence, proposal)` returns validated `{indicators,feedback}`. Indicator `{id,level:null|1|2|3|4,evidenceStatus:'present'|'insufficient',references:[],reason}`. `gradeWithConsensus(mission,evidence,options={})` returns `{providerReviews,indicators,status,feedback}`; status `agreed|provisional|needs_review|partial|unavailable`. Retain old fallback for legacy sessions.
- [ ] Write tests: three equal levels -> agreed; [2,3,3] -> provisional median 3; [1,3,4] -> needs_review; evidence-status mismatch -> needs_review; one/two failures -> partial; all fail -> unavailable; fabricated quotes, invalid IDs/ranges and prompt-injection answer rejected/treated as data; Unicode feedback <=400.
- [ ] Run `npx vitest run tests/unit/ai-consensus.test.js` expecting failure.
- [ ] Export independent provider adapters using existing endpoints/configuration; launch with Promise.allSettled, each capped at 45 seconds and no internal retry. Validate quotes/action references against recorded evidence. Disagreement never hidden by median. Select consistent feedback for priority indicator or use evidence-grounded template; no fourth call.
- [ ] Run new tests plus `tests/unit/ai-fallback.test.js`; expect PASS. Commit.

## Task 3: Persist submissions and safe orchestration for every mission
**Files:** Modify `src/server/ai-review.js`, `src/server/routes/progress.js`, `src/shared/assessment.js`, `src/shared/v2-evaluator.js`, `src/shared/contracts.js`. Create `src/server/assessment-submissions.js`, `tests/api/indicator-review.test.js`; modify `tests/api/ai-review.test.js`.
**Interfaces:** session adds `assessmentPolicy:'indicator-v1'`, `activityCompletedAt`, `indicatorAssessment:{fingerprint,status,providerReviews,indicators,feedback,claimToken,leaseUntil}`. `gradeIndicatorSession(db,sessionId,grader=gradeWithConsensus)` claims under row lock, releases connection before provider calls, applies result only if fingerprint/claim matches and no later teacher decision exists. Evidence assembled server-side from canonical events/state/tests, not supplied client marks.
- [ ] Tests cover every mission kind reaching assessment on submit, duplicate submission/check-status not grading again, concurrent claims only one grader, correction during grading retained, ownership, partial persistence and retry failed providers only. Maximum two attempts per provider per fingerprint; explicit retry endpoint allowed after first failure. All-fail preserves activity completion/evidence.
- [ ] Run `npx vitest run tests/api/indicator-review.test.js` expecting failure.
- [ ] Implement submission fingerprint with node:crypto over canonical evidence + versions; claim lease 60 seconds, total request budget below 180 seconds. Preserve successful reviews on retry. Offline sync reconstructs evidence from events and never trusts imported assessment fields. New policies only on new submissions; legacy remains readable.
- [ ] Run tests above plus progress/review/reconciliation/storage-sync/import tests; expect PASS. Commit.

## Task 4: Free replay, unique XP and independent mastery checks
**Files:** Modify `src/shared/progress.js`, `src/shared/mission-scoring.js`, `src/shared/assessment.js`, `src/shared/v2-evaluator.js`, `src/client/storage.js`, `src/client/sync.js`, `src/server/routes/progress.js`. Create `tests/unit/indicator-progress.test.js`; modify replay/boss-gate tests.
**Interfaces:** `summarizeProgress` adds `xp`, `achievements`, `indicatorResults`. Mastery-check events use server-known check ID/version and answer; record `assistance:{level,events}`, `evidenceMode:'practice'|'independent_check'`, and server-validated outcome. A fresh independent check contains no answer-revealing hints; requesting one changes mode to assisted practice.
- [ ] Tests: repeat completed mission/hints/errors/time leave unique XP at 100; old score archived; failed initial attempts do not average down latest valid independent result; success with help never declared independent; forged offline check fails; new activity completion unlocks next mission despite pending/low grade.
- [ ] Run new tests expecting failure.
- [ ] Implement XP from unique canonical completed mission IDs (including recorded historical completions), preserving historical scores separately. Boss unlock after 15 core activity completions; update old average-90 gate for new policy, retain archived interpretation. Add curated checks from Task 1; latest valid independent evidence wins, pending/conflict signals remain visible. Assistance records trusted hint events; new session alone does not prove independence after help.
- [ ] Run relevant unit and boss-gate API tests; expect PASS. Commit.

## Task 5: Nara and student capability display
**Files:** Modify `src/client/main.js`, `src/client/ui/nara-toast.js`, `src/client/ui/v2-activities.js`, `src/client/ui/score-breakdown.js`, `src/client/ui/report-help.js`, `src/shared/mission-guidance.js`, `src/client/ui.css`. Create `src/client/ui/indicator-results.js`, `tests/browser/indicator-results.spec.js`; modify floating-nara/ai-feedback/completed-next tests.
**Interfaces:** `indicatorResultsHtml(mission,assessment)` produces escaped accessible HTML with label, status/level, evidence and next step. Show pre-task descriptors; post-task XP separate. Nara answers use Task 2 feedback and curated guidance, never generic praise for empty answers.
- [ ] Browser tests: unknown answer has concrete question/no fabricated praise; feedback 350/400 Unicode chars visible on phone; HTML in answer escaped; partial/unavailable clear; retry free; mastery-check flow with hints records assisted state; next mission remains accessible while assessment pending.
- [ ] Run new Playwright test expecting failure.
- [ ] Implement UI and replace conflicting replay/time penalty/average score copy in map, leaderboard, report and help. Leaderboard uses unique XP rather than ability grades; enrichment excluded consistently. Keep old score UI only in labelled archive. Do not imply remote AI ran offline.
- [ ] Run indicator/floating-nara/ai-feedback/responsive/completed-next browser tests; expect PASS. Commit.

## Task 6: Teacher reports, correction and exports
**Files:** Modify `src/shared/reports.js`, `src/server/routes/teacher.js`, `src/client/main.js`, `src/client/ui/v2-activities.js`. Create `src/client/ui/indicator-report.js`, `tests/unit/indicator-reports.test.js`, `tests/api/indicator-teacher.test.js`, `tests/browser/indicator-teacher.spec.js`.
**Interfaces:** `buildIndicatorClassReport(participants,{className,threshold=3,thresholdVersion=1})` returns TP/indicator rows with roster denominator and exclusive groups `independent|needs_support|assisted|insufficient|pending`. API GET `/api/teacher/indicators` accepts class filter; teacher review accepts validated indicator decisions/reasons; threshold settings stored/versioned in existing settings table. Existing mission review supported for archives.
- [ ] Tests: empty roster; unattempted participants counted insufficient; one participant not double-counted through many sessions; latest independent evidence; assistance/conflict status; direct vs supporting TP evidence; legacy total never creates indicator value; teacher ownership and history; versioned threshold update; CSV formula escaping.
- [ ] Run new unit/API tests expecting failure.
- [ ] Implement class summary and drill-down roster, answers, assistance, three reviews and corrections. Teacher correction takes precedence; retain previous decisions. Export same indicator groups/data; archive old fields clearly. No inference that one partial indicator completes a TP.
- [ ] Run new tests plus reports/teacher/review API and teacher browser tests; expect PASS. Commit.

## Task 7: Calibration and full-flow verification
**Files:** Create `tests/fixtures/indicator-calibration.js`, `tests/unit/indicator-calibration.test.js`, `tests/browser/indicator-journey.spec.js`. Modify `GOOGLE_AI.md`, `PANDUAN_GURU.md`, `DEPLOYMENT.md`, `HASIL_UJI.md`.
- [ ] Create representative rubric-labelled fixtures per mission: insufficient, misconception, partial, meets, transfer. Label as developer reference until teacher confirms; do not claim validated human calibration. Tests exercise schema/evidence/aggregation, not assert mocked AI demonstrates accuracy.
- [ ] Run fixture checks and implement any missing validation before browser verification.
- [ ] Test browser -> API -> persisted evidence/three mocked provider reviews -> learner results -> teacher report/correction -> reload/export, plus offline replay and stale response scenarios.
- [ ] Run `npm test`, `npm run build`, `npm run test:browser`, `npm run test:offline`; record exact failures/successes. Real provider test only on synthetic evidence with configured credentials, explicitly distinguish from mocks; do not print secrets. Obtain teacher-labelled sample comparison before promoting automatic scoring as calibrated.
- [ ] Update docs: increased Gemini usage, provider concurrency, partial statuses, XP, evidence limits, migration and teacher override; record remaining calibration/live-provider limitations. Commit; preview and production follow existing session deployment authorization, otherwise present tested preview for concrete final approval.

## Self-review
All spec sections mapped to tasks: rubrics/checks (1), AI/evidence/Nara policy (2), persistence/failures (3), XP/mastery/archives (4), student flow (5), teacher/exports (6), calibration/end-to-end (7). Interfaces use a single indicator schema and fingerprint. Review Focus tests assigned above. No database-wide score rewrite or new dependencies needed.
