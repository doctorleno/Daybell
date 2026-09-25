import {scrypt,randomBytes,timingSafeEqual,createHash} from "node:crypto";
export const token=()=>randomBytes(32).toString("hex");
export const digest=(value:string)=>createHash("sha256").update(value).digest("hex");
// OWASP's scrypt configuration with 16 MiB memory and five parallelization rounds.
const options={N:16384,r:8,p:5,maxmem:32*1024*1024};
function derive(password:string,salt:string){return new Promise<Buffer>((resolve,reject)=>scrypt(password,salt,32,options,(err,result)=>err?reject(err):resolve(result)));}
export async function hashPassword(password:string){const salt=randomBytes(16).toString("hex");return ["scrypt","16384","8","5",salt,(await derive(password,salt)).toString("hex")].join("$");}
export async function verifyPassword(password:string,stored:string){
 const [algorithm,n,r,p,salt,hash]=stored.split("$");
 if(algorithm!=="scrypt"||n!=="16384"||r!=="8"||p!=="5"||!/^[a-f0-9]{32}$/.test(salt)||!/^[a-f0-9]{64}$/.test(hash))return false;
 return timingSafeEqual(await derive(password,salt),Buffer.from(hash,"hex"));
}
