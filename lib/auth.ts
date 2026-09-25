import {headers} from "next/headers";
import {database} from "@/db/raw";
import {digest} from "@/lib/password";
export type Account={userId:string;email:string;displayName:string};
export const SESSION_AGE=60*60*24*365;
export const COOKIE="__Host-daybell";
export const DEV_COOKIE="daybell_dev";
export function sessionCookie(req:Request,value:string,maxAge:number){
 const secure=new URL(req.url).protocol==="https:";
 return (secure?COOKIE:DEV_COOKIE)+"="+value+"; Path=/; HttpOnly; SameSite=Lax; Max-Age="+maxAge+(secure?"; Secure":"");
}
export function readToken(value:string,allowDev=false){
 const secure=value.split(";").map(x=>x.trim()).find(x=>x.startsWith(COOKIE+"="));
 const dev=value.split(";").map(x=>x.trim()).find(x=>x.startsWith(DEV_COOKIE+"="));
 const result=(secure??(allowDev?dev:undefined))?.split("=")[1]??"";
 return /^[a-f0-9]{64}$/.test(result)?result:"";
}
export async function getCurrentAccount():Promise<Account|null>{
 const h=await headers(),value=readToken(h.get("cookie")??"",/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(h.get("host")??""));if(!value)return null;
 const result=await database().prepare("SELECT u.id AS userId,u.email,u.name AS displayName FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>?").bind(digest(value),Date.now()).first<Account>();
 return result??null;
}
export function requireOrigin(req:Request){
 const origin=req.headers.get("origin");return origin===new URL(req.url).origin;
}
export function response(data:unknown,status=200){return Response.json(data,{status,headers:{"Cache-Control":"no-store, private"}});}


// Renew an existing valid session only; logout and recovery cannot be undone here.
export async function renewSession(req:Request,res:Response){
 const value=readToken(req.headers.get("cookie")??"",new URL(req.url).hostname==="localhost"||new URL(req.url).hostname==="127.0.0.1");
 if(!value)return res;
 const now=Date.now();
 await database().prepare("UPDATE sessions SET expires_at=? WHERE token_hash=? AND expires_at>? AND expires_at<?").bind(now+SESSION_AGE*1000,digest(value),now,now+(SESSION_AGE-86400)*1000).run();
 res.headers.set("Set-Cookie",sessionCookie(req,value,SESSION_AGE));return res;
}
