"use client";
import {useEffect,useState} from "react";
import {localSound,validateSound} from "@/lib/local-sound";
export default function SoundPicker({accountId}:{accountId:string}){
 const [name,setName]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 useEffect(()=>{let gone=false;void localSound(accountId).then(s=>{if(!gone)setName(s?.name??"");}).catch(()=>{if(!gone)setMessage("Device storage unavailable. Alarms will use Chime.");});return()=>{gone=true;};},[accountId]);
 async function choose(file?:File){if(!file)return;setBusy(true);setMessage("");try{await validateSound(file);await localSound(accountId,{name:file.name,blob:file});setName(file.name);setMessage("Saved on this device.");}catch(e){setMessage(e instanceof Error?e.message:"Could not save audio.");}finally{setBusy(false);}}
 return <div style={{padding:"12px 0",fontSize:13}}><label className="field">My alarm audio<input type="file" accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac" disabled={busy} onChange={e=>{void choose(e.target.files?.[0]);e.target.value="";}}/></label><p>{name||"No audio selected on this device."}</p>{name&&<button type="button" disabled={busy} onClick={()=>{void localSound(accountId,null).then(()=>{setName("");setMessage("Removed. Alarms will use Chime.");}).catch(()=>setMessage("Could not remove audio."));}}>Remove audio</button>}<p>One preferred file for this account on this device. Choosing a new file changes all “My audio” alarms here. Audio stays on this device and is not uploaded. Choose it again on other devices. Missing audio uses Chime. Maximum 15 MB; use a playable audio file, not a protected streaming download.</p><p role="status">{busy?"Checking audio…":message}</p></div>;
}
