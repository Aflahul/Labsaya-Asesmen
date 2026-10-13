import {test,expect,vi} from 'vitest';
import {gradeWithFallback} from '../../src/server/ai-grader.js';
import {BOSS} from '../../src/shared/missions.js';
const grade={marks:{design:0,solution:0,tests:0,reason:0},reasons:{design:'Salah',solution:'Salah',tests:'Salah',reason:'Salah'},feedback:'Coba periksa kembali aturan keberangkatan.'};
const config={google:{apiKey:'google-test'},groq:{apiKey:'groq-test',model:'openai/gpt-oss-120b'},openrouter:{apiKey:'router-test',model:'nvidia/nemotron-3.5-lightning:free'}};
test('legacy Groq success does not call another provider',async()=>{
 const fetchImpl=vi.fn(async()=>({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(grade)}}]})}));
 expect(await gradeWithFallback(BOSS,{}, {...config,fetchImpl})).toMatchObject({provider:'groq'});expect(fetchImpl).toHaveBeenCalledTimes(1);
});
test.each([429,503])('legacy Groq HTTP %s falls back to Gemini without calling OpenRouter',async status=>{
 const urls=[];const fetchImpl=async url=>{urls.push(url);if(url.includes('groq'))return {ok:false,status};return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify(grade)}]}}]})};};
 expect(await gradeWithFallback(BOSS,{}, {...config,fetchImpl})).toMatchObject({provider:'google'});expect(urls).toHaveLength(2);expect(urls[1]).toContain('googleapis');expect(urls.join(' ')).not.toContain('openrouter');
});
test('invalid legacy Groq scores fall back to Gemini',async()=>{
 const fetchImpl=async url=>({ok:true,json:async()=>url.includes('groq')?{choices:[{message:{content:JSON.stringify({...grade,marks:{...grade.marks,design:500}})}}]}:{candidates:[{content:{parts:[{text:JSON.stringify(grade)}]}}]}});
 expect(await gradeWithFallback(BOSS,{}, {...config,fetchImpl})).toMatchObject({provider:'google'});
});
test('OpenRouter is never requested even when other providers fail',async()=>{
 const fetchImpl=vi.fn(async()=>({ok:false,status:429}));
 await expect(gradeWithFallback(BOSS,{}, {google:config.google,groq:{apiKey:''},openrouter:config.openrouter,fetchImpl})).rejects.toThrow();expect(fetchImpl).toHaveBeenCalledTimes(1);
});
