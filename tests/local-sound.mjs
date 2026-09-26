import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync('lib/local-sound.ts','utf8');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const records=new Map([['alice',{name:'personal.wav',blob:new Blob(['audio'])}]]);
let delayed=false,release;const players=[],revoked=[];
const indexedDB={open(){const r={};queueMicrotask(()=>{r.result={close(){},transaction(){const tx={};const read=()=>{const q={};const complete=()=>{q.result=records.get(key);tx.oncomplete();};let key;return {get(k){key=k;if(delayed)release=complete;else queueMicrotask(complete);return q;}};};tx.objectStore=read;return tx;}};r.onsuccess();});return r;}};
class Audio{constructor(url){this.url=url;players.push(this);}async play(){this.played=true;}pause(){this.paused=true;}removeAttribute(){}load(){}}
const exports={};new Function('exports','indexedDB','Audio','URL',js)(exports,indexedDB,Audio,{createObjectURL:()=> 'blob:test',revokeObjectURL:u=>revoked.push(u)});
const p=new exports.LocalPlayer();
assert.equal(await p.play('alice',true),true);assert.equal(players[0].loop,true);p.stop();assert.equal(players[0].paused,true);assert.equal(revoked.length,1);
assert.equal(await p.play('bob',true),false);assert.equal(players.length,1,'another account cannot select Alice audio');
delayed=true;const pending=p.play('alice',true);await new Promise(r=>setTimeout(r,0));p.stop();release();await pending;assert.equal(players.length,1,'stop cancels pending storage read');
await assert.rejects(exports.validateSound({size:16*1024*1024}),/15 MB/);
await assert.rejects(exports.validateSound({size:12,type:'text/plain',name:'test.txt'}),/audio file/);
console.log('PASS: account isolation, looping, stop cleanup, stop while loading, file size/type rejection');
