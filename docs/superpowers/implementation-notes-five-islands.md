# Execution ledger — 2026-10-10-five-islands
Base: 6390d36. Isolated branch feat/five-islands.
Ruling: preserve v1 catalog/reducer and add v2 IDs; historic scores remain separately reportable.
Ruling: C5/C6 teacher review instead of unreliable automatic grading of prose.
Pre-flight: evaluator output consumed by reducer; pending_review must be terminal for student actions and sync must adopt server review.
Task 1: complete — versioned 5-island catalog, isolated legacy IDs, best-score mean and strict boss gate. Initial RED tests became GREEN.
Task 2: complete — objective/written activities and teacher-only rubric review. API authorization/range/repeat tests GREEN. Python printed-list snapshot and finite values RED→GREEN.
Task 3: complete — 26 assets converted to 4,991,674 bytes WebP, interactive map and scenes, responsive DOM controls. Browser 6/6 passed; offline production check pending.
Ruling: DOM/CSS visual scene renderer replaces procedural Phaser renderer — improves asset clarity, keyboard control and resize behavior with a smaller runtime; no physics mechanics are needed.
Ruling: no separate demo identity — retain existing real-account/offline architecture and avoid adding an unrequested authentication path.
Task 3 correction: stale sync label was misleading after new events; mark pending immediately. Teacher-review end-to-end test failed before fix and passed after.
Final review: fresh reviewer final_review (gpt-6-astra). Two important findings; no deferred minors.
Final: fixed Python exponential/cyclic list graph — flat-list rejection test RED→GREEN.
Final: fixed per-keystroke draft history growth — bounded snapshot/draft replay tests RED→GREEN; 3300 input events survive offline browser reload with cache under1MB.
Task 4: complete — npm test 61/61, production browser7/7, Vite build passed, diff check passed. No actual Vercel/Neon smoke test.
