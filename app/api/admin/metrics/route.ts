import {database} from "@/db/raw";
import {getCurrentAccount,response} from "@/lib/auth";
import {isOwner} from "@/lib/admin";
export async function GET(){
 const account=await getCurrentAccount();if(!account)return response({error:"Sign in first."},401);if(!isOwner(account))return response({error:"Owner access required."},403);
 const today=new Date().toISOString().slice(0,10),since=new Date(Date.now()-29*86400000).toISOString().slice(0,10);
 const db=database();
 const results=await db.batch<Record<string,unknown>>([
 db.prepare("SELECT COUNT(*) AS total FROM users"),
 db.prepare("SELECT COUNT(*) AS total FROM users WHERE created_at>=?").bind(Date.parse(today+'T00:00:00Z')),
 db.prepare("SELECT COUNT(DISTINCT user_id) AS total FROM account_activity WHERE day=?").bind(today),
 db.prepare("SELECT COUNT(DISTINCT user_id) AS total FROM account_activity WHERE day>=?").bind(since),
 db.prepare("SELECT MAX(last_seen) AS last_seen FROM account_activity"),
 db.prepare("SELECT day,COUNT(*) AS active_accounts FROM account_activity WHERE day>=? GROUP BY day ORDER BY day DESC").bind(since),
 db.prepare("SELECT strftime('%Y-%m-%d',created_at/1000,'unixepoch') AS day,COUNT(*) AS registrations FROM users WHERE created_at>=? GROUP BY day").bind(Date.parse(since+'T00:00:00Z')),
 db.prepare("SELECT started_at FROM analytics_settings WHERE id=1")
 ]);
 const count=(i:number)=>Number(results[i].results[0]?.total??0);
 return response({ownerEmail:account.email,registeredAccounts:count(0),registeredToday:count(1),activeToday:count(2),active30Days:count(3),lastActivity:results[4].results[0]?.last_seen??null,activity:results[5].results,registrations:results[6].results,trackingStarted:results[7].results[0]?.started_at??null,generatedAt:Date.now()});
}

