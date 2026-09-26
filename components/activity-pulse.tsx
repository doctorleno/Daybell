"use client";
import {useEffect} from "react";
export default function ActivityPulse(){useEffect(()=>{
 let lastInteraction=Date.now(),lastSent=0,busy=false;
 const send=async()=>{const now=Date.now();if(busy||document.visibilityState!=="visible"||now-lastInteraction>300000||now-lastSent<300000)return;busy=true;try{const r=await fetch("/api/activity",{method:"POST",credentials:"same-origin"});if(r.ok)lastSent=now;}catch{}finally{busy=false;}};
 const interact=()=>{lastInteraction=Date.now();void send();};const visible=()=>{if(document.visibilityState==="visible")interact();};
 window.addEventListener("pointerdown",interact);window.addEventListener("keydown",interact);document.addEventListener("visibilitychange",visible);void send();const timer=setInterval(()=>void send(),60000);
 return()=>{clearInterval(timer);window.removeEventListener("pointerdown",interact);window.removeEventListener("keydown",interact);document.removeEventListener("visibilitychange",visible);};
 },[]);return null;}
