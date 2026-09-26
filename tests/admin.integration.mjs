import assert from 'node:assert/strict';
const base='http://localhost:5184',password='Local-admin-test-456123!',ownerEmail='dashboard-local@example.invalid';
async function call(path,body,cookie='',origin=base){const r=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),redirect:'manual'});const text=await r.text();let data;try{data=JSON.parse(text);}catch{data=text;}return {status:r.status,data,cookie:r.headers.get('set-cookie')?.split(';')[0]||''};}
assert.equal((await call('/api/admin/metrics')).status,401);
assert.equal((await call('/api/activity',{})).status,401);
const owner=await call('/api/auth/login',{email:ownerEmail,password});assert.equal(owner.status,200);
const stranger=await call('/api/auth/signup',{email:`metrics-other-${Date.now()}@example.invalid`,password,name:'Other local test'});assert.equal(stranger.status,200);
try{
assert.equal((await call('/api/admin/metrics',undefined,stranger.cookie)).status,403);
assert.equal((await call('/api/admin/email',{email:'forbidden@example.invalid',confirmEmail:'forbidden@example.invalid',password},stranger.cookie)).status,403);
assert.equal((await call('/api/activity',{},owner.cookie,'https://untrusted.invalid')).status,403);
const before=await call('/api/admin/metrics',undefined,owner.cookie);assert.equal(before.status,200);
assert.equal((await call('/api/activity',{},stranger.cookie)).status,200);
assert.equal((await call('/api/activity',{},stranger.cookie)).status,200);
const after=await call('/api/admin/metrics',undefined,owner.cookie);assert.equal(after.data.activeToday,before.data.activeToday+1);assert.equal(after.data.active30Days,before.data.active30Days+1);
assert.ok(after.data.trackingStarted);assert.ok(after.data.lastActivity);
assert.ok(!JSON.stringify(after.data).includes('password_hash'));assert.ok(!JSON.stringify(after.data).includes('Other local test'));
assert.equal((await call('/api/admin/email',{email:'new-owner-local@example.invalid',confirmEmail:'new-owner-local@example.invalid',password:'wrong'},owner.cookie)).status,403);
const changed=await call('/api/admin/email',{email:'new-owner-local@example.invalid',confirmEmail:'new-owner-local@example.invalid',password},owner.cookie);assert.equal(changed.status,200);
const relogin=await call('/api/auth/login',{email:'new-owner-local@example.invalid',password});assert.equal(relogin.status,200);
const metrics=await call('/api/admin/metrics',undefined,relogin.cookie);assert.equal(metrics.status,200);assert.equal(metrics.data.ownerEmail,'new-owner-local@example.invalid');
console.log('PASS: owner-only access, unauthenticated rejection, origin checks, activity deduplication, aggregate privacy, password check and owner access after email change.');
}finally{
await call('/api/admin/email',{email:ownerEmail,confirmEmail:ownerEmail,password},owner.cookie);
await fetch(base+'/api/account',{method:'DELETE',headers:{Origin:base,Cookie:stranger.cookie,'Content-Type':'application/json'},body:JSON.stringify({password})});
}

