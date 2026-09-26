import {database} from "@/db/raw";
import {getCurrentAccount,requireOrigin,response,renewSession,sessionCookie} from "@/lib/auth";
import {verifyPassword} from "@/lib/password";
export async function GET(req:Request){const account=await getCurrentAccount();if(!account)return response({error:"Sign in to access your account."},401);return renewSession(req,response(account));}
export async function DELETE(req:Request){
 if(!requireOrigin(req))return response({error:"Request origin not allowed."},403);
 const account=await getCurrentAccount();if(!account)return response({error:"Sign in first."},401);
 let body:any;try{const text=await req.text();if(text.length>4096)return response({error:"Request too large."},413);body=JSON.parse(text);}catch{return response({error:"Invalid request."},400);}
 if(typeof body.password!=="string"||body.password.length>128)return response({error:"Enter your password."},400);
 const bucket="delete:"+account.userId+":"+Math.floor(Date.now()/900000);
 const attempts=await database().prepare("INSERT INTO auth_limits (bucket,attempts,expires_at) VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET attempts=attempts+1 RETURNING attempts").bind(bucket,Date.now()+1800000).first<{attempts:number}>();
 if(!attempts||attempts.attempts>10)return response({error:"Too many attempts. Try again in 15 minutes."},429);
 const user=await database().prepare("SELECT password_hash FROM users WHERE id=?").bind(account.userId).first<{password_hash:string}>();
 if(!user||!await verifyPassword(body.password,user.password_hash))return response({error:"Password is incorrect."},403);
 await database().batch([database().prepare("DELETE FROM entries WHERE owner_id=?").bind(account.userId),database().prepare("DELETE FROM sessions WHERE user_id=?").bind(account.userId),database().prepare("DELETE FROM users WHERE id=?").bind(account.userId)]);
 const res=response({ok:true});res.headers.set("Set-Cookie",sessionCookie(req,"",0));return res;
}
