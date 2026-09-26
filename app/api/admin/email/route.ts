import {database} from "@/db/raw";
import {getCurrentAccount,requireOrigin,response} from "@/lib/auth";
import {isOwner} from "@/lib/admin";
import {verifyPassword} from "@/lib/password";
import {z} from "zod";
export async function POST(req:Request){
 if(!requireOrigin(req))return response({error:"Request origin not allowed."},403);
 const account=await getCurrentAccount();if(!account)return response({error:"Sign in first."},401);if(!isOwner(account))return response({error:"Owner access required."},403);
 let raw:unknown;try{const text=await req.text();if(text.length>4096)return response({error:"Request too large."},413);raw=JSON.parse(text);}catch{return response({error:"Invalid form."},400);}
 const parsed=z.object({email:z.string().trim().email().max(254).transform(x=>x.toLowerCase()),confirmEmail:z.string().trim().email().max(254).transform(x=>x.toLowerCase()),password:z.string().min(1).max(128)}).safeParse(raw);
 if(!parsed.success||parsed.data.email!==parsed.data.confirmEmail)return response({error:"Enter matching valid email addresses and your current password."},400);
 const bucket="owner-email:"+account.userId+":"+Math.floor(Date.now()/900000);
 const attempts=await database().prepare("INSERT INTO auth_limits (bucket,attempts,expires_at) VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET attempts=attempts+1 RETURNING attempts").bind(bucket,Date.now()+1800000).first<{attempts:number}>();
 if(!attempts||attempts.attempts>10)return response({error:"Too many attempts. Try again in 15 minutes."},429);
 const user=await database().prepare("SELECT password_hash FROM users WHERE id=?").bind(account.userId).first<{password_hash:string}>();
 if(!user||!await verifyPassword(parsed.data.password,user.password_hash))return response({error:"Password is incorrect."},403);
 try{const changed=await database().prepare("UPDATE users SET email=? WHERE id=? AND password_hash=?").bind(parsed.data.email,account.userId,user.password_hash).run();if(!changed.meta.changes)return response({error:"Account changed. Sign in and try again."},409);}catch(e){if(String(e).includes("UNIQUE"))return response({error:"That email is unavailable. Choose another address."},409);throw e;}
 return response({ok:true,email:parsed.data.email});
}
