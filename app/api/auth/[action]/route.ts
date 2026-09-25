import {database} from "@/db/raw";
import {digest,token,hashPassword,verifyPassword} from "@/lib/password";
import {requireOrigin,response,sessionCookie,readToken,SESSION_AGE} from "@/lib/auth";
import {z} from "zod";
const form=z.object({email:z.string().trim().email().max(254).transform(x=>x.toLowerCase()),password:z.string().min(12).max(128),name:z.string().trim().min(1).max(80).optional(),recoveryCode:z.string().max(100).optional()});
type User={id:string;password_hash:string;recovery_hash:string};
async function limited(req:Request,email:string){
 const now=Date.now(),windowMs=15*60*1000;
 const ip=req.headers.get("cf-connecting-ip")??"local";
 for(const [scope,value,max] of [["ip",ip,30],["account",email,10]] as const){
  const bucket=digest(scope+":"+value+":"+Math.floor(now/windowMs));
  const r=await database().prepare("INSERT INTO auth_limits (bucket,attempts,expires_at) VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET attempts=attempts+1 RETURNING attempts").bind(bucket,now+windowMs*2).first<{attempts:number}>();
  if(!r||r.attempts>max)return true;
 }
 await database().prepare("DELETE FROM auth_limits WHERE expires_at<?").bind(now).run();
 return false;
}
async function signedIn(req:Request,id:string,passwordHash:string,extra:Record<string,unknown>={}){
 const secret=token(),age=SESSION_AGE;
 const inserted=await database().prepare("INSERT INTO sessions (token_hash,user_id,expires_at) SELECT ?,id,? FROM users WHERE id=? AND password_hash=?").bind(digest(secret),Date.now()+age*1000,id,passwordHash).run();
 if(!inserted.meta.changes)return response({error:"Your password changed. Please sign in again."},401);
 await database().prepare("DELETE FROM sessions WHERE expires_at<?").bind(Date.now()).run();
 const res=response({ok:true,...extra});res.headers.set("Set-Cookie",sessionCookie(req,secret,age));return res;
}
export async function POST(req:Request){
 try{
 if(!requireOrigin(req))return response({error:"Request origin not allowed."},403);
 const action=new URL(req.url).pathname.split("/").pop();
 if(action==="logout"){
  const value=readToken(req.headers.get("cookie")??"",new URL(req.url).protocol==="http:");
  if(value)await database().prepare("DELETE FROM sessions WHERE token_hash=?").bind(digest(value)).run();
  const res=response({ok:true});res.headers.set("Set-Cookie",sessionCookie(req,"",0));return res;
 }
 if(!["login","signup","recover"].includes(action??""))return response({error:"Not found."},404);
 if(Number(req.headers.get("content-length")??0)>4096)return response({error:"Request too large."},413);
 const text=await req.text();if(text.length>4096)return response({error:"Request too large."},413);
 let raw:unknown;try{raw=JSON.parse(text);}catch{return response({error:"Invalid form."},400);}
 const parsed=form.safeParse(raw);if(!parsed.success)return response({error:"Enter a valid email and a password with 12–128 characters."},400);
 const b=parsed.data;
 if(await limited(req,b.email))return response({error:"Too many attempts. Please wait 15 minutes and try again."},429);
 const user=await database().prepare("SELECT id,password_hash,recovery_hash FROM users WHERE email=?").bind(b.email).first<User>();
 if(action==="signup"){
  if(!b.name)return response({error:"Enter your name."},400);
  if(user)return response({error:"Unable to create this account. Try signing in or recovering your account."},400);
  const id=crypto.randomUUID(),recoveryCode=token(),passwordHash=await hashPassword(b.password);
  try{await database().prepare("INSERT INTO users (id,email,name,password_hash,recovery_hash,created_at) VALUES (?,?,?,?,?,?)").bind(id,b.email,b.name,passwordHash,digest(recoveryCode),Date.now()).run();}
  catch(e){if(String(e).includes("UNIQUE"))return response({error:"Unable to create this account. Try signing in."},400);throw e;}
  return signedIn(req,id,passwordHash,{recoveryCode});
 }
 if(action==="recover"){
  const valid=/^[a-f0-9]{64}$/.test(b.recoveryCode??"");
  if(!user||!valid||digest(b.recoveryCode!)!==user.recovery_hash)return response({error:"Email or recovery key is incorrect."},400);
  const code=token(),hash=await hashPassword(b.password);
  // Conditional update makes each recovery key single-use, even with concurrent requests.
  const result=await database().prepare("UPDATE users SET password_hash=?,recovery_hash=? WHERE id=? AND recovery_hash=?").bind(hash,digest(code),user.id,digest(b.recoveryCode!)).run();
  if(!result.meta.changes)return response({error:"Recovery key has already been used."},400);
  await database().prepare("DELETE FROM sessions WHERE user_id=?").bind(user.id).run();
  return signedIn(req,user.id,hash,{recoveryCode:code});
 }
 if(!user){await hashPassword(b.password);return response({error:"Email or password is incorrect."},401);}
 if(!await verifyPassword(b.password,user.password_hash))return response({error:"Email or password is incorrect."},401);
 return signedIn(req,user.id,user.password_hash);
 }catch(e){console.error("Authentication failed",e);return response({error:"Sign-in is temporarily unavailable. Please try again."},503);}
}

