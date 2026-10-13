import {test,expect} from 'vitest';
import {buildIndicatorClassReport,indicatorExportRows} from '../../src/shared/reports.js';
import {getIndicatorRubric} from '../../src/shared/indicator-rubrics.js';
const id='v2p01m01',indicator=getIndicatorRubric(id).indicators[0].id;
const session=(level,mode='independent_check')=>({id:'s',missionId:id,assessmentPolicy:'indicator-v1',activityCompletedAt:'2026-01-01',completedAt:'2026-01-01',indicatorAssessment:{status:'agreed',evidenceMode:mode,at:'2026-01-01',indicators:[{id:indicator,level,status:'agreed',evidenceStatus:'present'}]}});
test('roster denominator includes unattempted and archives without inventing indicator grades',()=>{
 const roster=[{id:'a',class_name:'X',real_name:'A',sessions:[session(3)]},{id:'b',class_name:'X',real_name:'B',sessions:[]},{id:'c',class_name:'Y',real_name:'C',sessions:[{missionId:id,status:'complete',score:100}]}];
 const r=buildIndicatorClassReport(roster,{className:'X'});const row=r.rows.find(x=>x.id===indicator);
 expect(r.denominator).toBe(2);expect(row.groups.independent).toHaveLength(1);expect(row.groups.insufficient).toHaveLength(1);
 expect(Object.values(row.groups).flat()).toHaveLength(2);
 const archive=buildIndicatorClassReport(roster,{className:'Y'}).rows.find(x=>x.id===indicator);expect(archive.groups.insufficient).toHaveLength(1);
});
test('versioned threshold changes category, not evidence or original result',()=>{
 const r=buildIndicatorClassReport([{id:'a',sessions:[session(3)]}],{threshold:4,thresholdVersion:2});
 expect(r.rows.find(x=>x.id===indicator).groups.needs_support).toHaveLength(1);expect(r.thresholdVersion).toBe(2);
 expect(indicatorExportRows(r)[0]['Jumlah murid']).toBe(1);
});
