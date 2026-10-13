import {getMasteryCheckGuide} from "../../src/server/mastery-check-guide.js";
// Developer reference examples for teacher calibration; these are NOT validated teacher ratings.
import {MISSIONS} from '../../src/shared/missions.js';
import {solution} from './solutions.js';
import {getIndicatorRubric} from '../../src/shared/indicator-rubrics.js';
import {missionMasteryCheck} from '../../src/shared/mastery-checks.js';
export const indicatorCalibration = MISSIONS.map(m=>({missionId:m.id,confirmedByTeacher:false,rubric:getIndicatorRubric(m.id),examples:[
 {label:'insufficient',answers:Object.fromEntries((m.written||[...m.rules.fields.map(f=>[f.key]),...(m.code?[['code']]:[])]).map(([key])=>[key,'tidak tahu'])),expectedLevel:null},
 {label:'misconception',answers: m.written ? Object.fromEntries(m.written.map(([key])=>[key,'Semua data boleh digunakan tanpa pemeriksaan; satu jawaban selalu berlaku.'])) : Object.fromEntries([...m.rules.fields.map(f=>[f.key,f.options.find(o=>o!==m.rules.answers[f.key])]), ...(m.code? [['code',m.code]]:[])]),expectedLevel:1},
 {label:'partial',answers:Object.fromEntries(solution(m).map((a,index)=>[a.key,index===0?a.value:'tidak tahu'])),expectedLevel:2},
 {label:'meets',answers:Object.fromEntries(solution(m).map(a=>[a.key,a.value])),expectedLevel:3},
 {label:'transfer',answers:{response:getMasteryCheckGuide(m.id)},expectedLevel:4}
]}));
