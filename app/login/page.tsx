"use client";
import {useState} from "react";
export default function Login(){
 const [mode,setMode]=useState("login"),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[name,setName]=useState(""),[recovery,setRecovery]=useState(""),[newKey,setNewKey]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 async function submit(event:React.FormEvent){event.preventDefault();setBusy(true);setError("");try{
 const res=await fetch("/api/auth/"+mode,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password,...(name?{name}:{}),...(recovery?{recoveryCode:recovery}:{})})});
 const data=await res.json() as {error?:string;recoveryCode?:string};if(!res.ok)throw Error(data.error??"Could not sign in.");
 if(data.recoveryCode){setNewKey(data.recoveryCode);setPassword("");}else location.assign("/");
 }catch(e){setError(e instanceof Error?e.message:"Could not sign in.");}finally{setBusy(false);}}
 return <main className="signin-page"><div className="signin-card"><span className="brand">daybell.</span>
 {newKey?<><h1>Save your recovery key.</h1><p>This is the only way to reset your password. Keep it in your password manager. No email reset service is configured.</p><textarea aria-label="Your recovery key" readOnly value={newKey} rows={3}/><button className="primary" onClick={()=>location.assign("/")}>I saved my key — open calendar</button></>:<>
 <h1>{mode==="signup"?"Your own little space.":mode==="recover"?"Recover your account.":"Welcome back."}</h1><p>Your calendar belongs to you. Sign in once to stay signed in on this browser.</p>
 <form className="authform" onSubmit={submit}>
 {mode==="signup"&&<label>Name<input autoComplete="name" value={name} maxLength={80} onChange={e=>setName(e.target.value)} required/></label>}
 <label>Email<input type="email" autoComplete="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} required/></label>
 {mode==="recover"&&<label>Recovery key<input autoComplete="off" value={recovery} onChange={e=>setRecovery(e.target.value)} required minLength={64} maxLength={64}/></label>}
 <label>{mode==="recover"?"New password":"Password"}<input type="password" autoComplete={mode==="login"?"current-password":"new-password"} minLength={12} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} required/></label>
 {mode!=="login"&&<small>Use at least 12 characters. Save the recovery key shown after this step.</small>}
 {error&&<p role="alert">{error}</p>}<button className="primary" disabled={busy}>{busy?"Please wait…":mode==="signup"?"Create account":mode==="recover"?"Reset password":"Sign in"}</button></form>
 <div className="authlinks"><button onClick={()=>{setMode(mode==="signup"?"login":"signup");setError("");}}>{mode==="signup"?"Already registered? Sign in":"Create an account"}</button><button onClick={()=>{setMode(mode==="recover"?"login":"recover");setError("");}}>{mode==="recover"?"Back to sign in":"Forgot password?"}</button></div>
 </>}
 </div></main>;
}
