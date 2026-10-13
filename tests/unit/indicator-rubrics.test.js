import { test, expect } from 'vitest';
import { MISSIONS } from '../../src/shared/missions.js';
import { getIndicatorRubric } from '../../src/shared/indicator-rubrics.js';
import { getMasteryCheck } from '../../src/shared/mastery-checks.js';
test('all missions including boss have specific indicators, descriptors and transfer checks', () => {
  const ids = [];
  for (const m of MISSIONS) {
    const r = getIndicatorRubric(m.id);
    expect(r.version).toBe(1);
    expect(r.indicators.length).toBeGreaterThan(0);
    for (const i of r.indicators) {
      ids.push(i.id);
      expect(Object.keys(i.descriptors)).toEqual(['1','2','3','4']);
      expect(i.requiredEvidence.length).toBeGreaterThan(0);
      for (const link of i.tpLinks) expect(['direct','partial','supporting']).toContain(link.coverage);
      const check = getMasteryCheck(m.id, i.id);
      expect(check.prompt.length).toBeGreaterThan(20);
      expect(check.expectedEvidence.length).toBeGreaterThan(10);
    }
  }
  expect(new Set(ids).size).toBe(ids.length);
  expect(getIndicatorRubric(MISSIONS[0].id).indicators.every(i=>i.tpLinks.every(l=>l.coverage==='supporting'))).toBe(true);
});
