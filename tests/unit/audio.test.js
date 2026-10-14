import {test,expect,vi} from 'vitest';
import {createAudio} from '../../src/client/audio.js';
test('background music starts on interaction, loops quietly, obeys mute and pauses in hidden tabs',()=>{
 const values=new Map(),instances=[];let visibility;
 const document={hidden:false,body:{append:()=>{}},addEventListener:(_event,fn)=>visibility=fn};
 class Audio{constructor(src){this.src=src;this.play=vi.fn(()=>Promise.resolve());this.pause=vi.fn();instances.push(this);}}
 vi.stubGlobal('Audio',Audio);vi.stubGlobal('document',document);vi.stubGlobal('localStorage',{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)});
 try{
  const audio=createAudio();expect(instances).toHaveLength(0);
  audio.unlock();const music=instances[0];expect(music.loop).toBe(true);expect(music.volume).toBe(0.12);expect(music.play).toHaveBeenCalledTimes(1);
  audio.setMuted(true);expect(music.pause).toHaveBeenCalledTimes(1);expect(values.get('pulau:mute')).toBe('true');
  audio.setMuted(false);document.hidden=true;visibility();expect(music.pause).toHaveBeenCalledTimes(2);
  document.hidden=false;visibility();expect(music.play).toHaveBeenCalledTimes(3);
  audio.setMusicVolume(1);expect(music.volume).toBe(0.3);audio.setMusicVolume(0);expect(music.pause).toHaveBeenCalledTimes(3);
  expect(createAudio().musicVolume).toBe(0);
 }finally{vi.unstubAllGlobals();}
});
