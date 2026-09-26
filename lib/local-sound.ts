export type LocalSound={name:string;blob:Blob};
function database():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const r=indexedDB.open("daybell-local-audio",1);r.onupgradeneeded=()=>r.result.createObjectStore("sounds");r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function localSound(account:string,value?:LocalSound|null):Promise<LocalSound|undefined>{
 const db=await database();try{return await new Promise((resolve,reject)=>{const tx=db.transaction("sounds",value===undefined?"readonly":"readwrite"),store=tx.objectStore("sounds");const r=value===undefined?store.get(account):value===null?store.delete(account):store.put(value,account);tx.oncomplete=()=>resolve(value===undefined?r.result:undefined);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}finally{db.close();}
}
export async function validateSound(file:File){
 if(!file.size||file.size>15*1024*1024)throw Error("Choose an audio file smaller than 15 MB.");
 if(!file.type.startsWith("audio/")&&!/\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(file.name))throw Error("Choose an MP3, WAV, M4A, AAC, OGG or FLAC audio file.");
 const url=URL.createObjectURL(file),audio=new Audio();
 try{await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(Error("This audio file could not be read.")),10000);const finish=(ok:boolean)=>{clearTimeout(timer);ok?resolve():reject(Error("This device cannot play that file. Try MP3 or WAV."));};audio.onloadedmetadata=()=>finish(Number.isFinite(audio.duration)&&audio.duration>0);audio.onerror=()=>finish(false);audio.preload="metadata";audio.src=url;});}finally{audio.removeAttribute("src");audio.load();URL.revokeObjectURL(url);}
}
export class LocalPlayer{
 private token=0;private audio:HTMLAudioElement|null=null;private url:string|null=null;private timer:ReturnType<typeof setTimeout>|undefined;
 stop(){this.token++;clearTimeout(this.timer);if(this.audio){this.audio.pause();this.audio.removeAttribute("src");this.audio.load();this.audio=null;}if(this.url){URL.revokeObjectURL(this.url);this.url=null;}}
 async play(account:string,loop=false):Promise<boolean>{this.stop();const token=this.token;const saved=await localSound(account);if(token!==this.token)return true;if(!saved)return false;
 this.url=URL.createObjectURL(saved.blob);const audio=new Audio(this.url);this.audio=audio;audio.loop=loop;
 try{await audio.play();if(token!==this.token)return true;if(!loop){audio.onended=()=>this.stop();this.timer=setTimeout(()=>this.stop(),10000);}return true;}catch(e){if(token!==this.token)return true;this.stop();throw e;}
 }
}
