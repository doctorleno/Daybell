import {database} from "@/db/raw";
import {getCurrentAccount,requireOrigin,response} from "@/lib/auth";
export async function POST(req:Request){
 if(!requireOrigin(req))return response({error:"Request origin not allowed."},403);
 const account=await getCurrentAccount();if(!account)return response({error:"Sign in first."},401);
 const now=Date.now(),day=new Date(now).toISOString().slice(0,10);
 // One record per account/day; repeated tabs cannot inflate unique-user counts.
 await database().prepare("INSERT INTO account_activity (user_id,day,last_seen) VALUES (?,?,?) ON CONFLICT(user_id,day) DO UPDATE SET last_seen=excluded.last_seen WHERE account_activity.last_seen<?").bind(account.userId,day,now,now-300000).run();
 await database().prepare("DELETE FROM account_activity WHERE day<?").bind(new Date(now-89*86400000).toISOString().slice(0,10)).run();
 return response({ok:true});
}
