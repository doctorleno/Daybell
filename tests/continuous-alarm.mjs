import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";
const source=readFileSync("app/planner.tsx","utf8");
const from=source.indexOf("    const stopAudio="),to=source.indexOf("    useEffect(()=>{const audible",from);
const segment=source.slice(from,to);
const js=ts.transpileModule(segment,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const nodes=[];
class Context{
 sampleRate=8000;state="running";destination={};
 async resume(){}
 createBuffer(){return {getChannelData:()=>new Float32Array(24000)};}
 createBufferSource(){const n={loop:false,started:0,stopped:0,connect(){},disconnect(){},start(){this.started++},stop(){this.stopped++}};nodes.push(n);return n;}
}
const ringing={current:null},ringToken={current:0},audio={current:null},notices=[];
let active=[1];
const api=new Function("ringing","ringToken","audio","AudioContext","setNotice","setActive",js+";return {startRinging,stopRinging};")(ringing,ringToken,audio,Context,x=>notices.push(x),x=>active=x);
await api.startRinging("Chime");assert.equal(nodes.length,1);assert.equal(nodes[0].loop,true);assert.equal(nodes[0].started,1);
await api.startRinging("Bell");assert.equal(nodes.length,1);
api.stopRinging();assert.equal(nodes[0].stopped,1);assert.deepEqual(active,[]);
await api.startRinging("Silent");assert.equal(nodes.length,1);
let resume;audio.current.resume=()=>new Promise(r=>resume=r);
const pending=api.startRinging("Bell");api.stopRinging();resume();await pending;assert.equal(nodes.length,1);
console.log("PASS: persistent looping source, no duplicate loops, explicit stop, silent option, and stop-during-resume race.");
