import {test,expect} from 'vitest';
import {indicatorCalibration} from '../fixtures/indicator-calibration.js';
import {validateIndicatorGrade} from '../../src/shared/indicator-assessment.js';
test('reference corpus spans every mission and does not claim human calibration',()=>{
 expect(indicatorCalibration).toHaveLength(16);
 for(const item of indicatorCalibration){expect(item.confirmedByTeacher).toBe(false);expect(item.examples.map(e=>e.label)).toEqual(['insufficient','misconception','partial','meets','transfer']);expect(item.examples.every(e=>Object.keys(e.answers).length>0)).toBe(true);}
});
test('unknown-reference examples cannot earn high grades across all missions',()=>{
 for(const {rubric,examples} of indicatorCalibration){
  const answers=examples[0].answers;
  const p={indicators:rubric.indicators.map(i=>({id:i.id,level:3,evidenceStatus:'present',references:i.fields.filter(k=>answers[k]).map(key=>({key,quote:answers[key]})),reason:'Penilai keliru memberi tingkat tinggi.'})),feedback:'Kamu sudah menguasai semuanya.'};
  const r=validateIndicatorGrade(rubric,{answers,mode:'practice'},p);
  expect(r.indicators.every(i=>i.level===null)).toBe(true);expect(r.feedback).not.toContain('menguasai');
 }
});
