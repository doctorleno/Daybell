import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://localhost:5184';
const email=`delete-test-${Date.now()}@example.invalid`,password='test-long-password-121212';
async function request(path,body,cookie='',method=body?'POST':'GET'){const r=await fetch(base+path,{method,headers:{Origin:base,Cookie:cookie,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]||''};}
assert.equal((await request('/api/account')).status,401);
const user=await request('/api/auth/signup',{email,password,name:'Deletion test'});assert.equal(user.status,200);
assert.equal((await request('/api/account',undefined,user.cookie)).data.email,email);
const entry=await request('/api/entries',{title:'Only this test entry',kind:'event',starts:new Date(Date.now()+100000).toISOString(),minutes:0,sound:'Silent',notes:'',done:0},user.cookie);assert.equal(entry.status,201);
assert.equal((await request('/api/account',{password:'incorrect-password'},user.cookie,'DELETE')).status,403);
assert.equal((await request('/api/entries',undefined,user.cookie)).data.length,1);
assert.equal((await request('/api/account',{password},user.cookie,'DELETE')).status,200);
assert.equal((await request('/api/account',undefined,user.cookie)).status,401);
assert.equal((await request('/api/auth/login',{email,password})).status,401);
const recreated=await request('/api/auth/signup',{email,password,name:'Recreated'});assert.equal(recreated.status,200);
assert.equal((await request('/api/entries',undefined,recreated.cookie)).data.length,0);
await request('/api/account',{password},recreated.cookie,'DELETE');
console.log('PASS: account identity, deletion password check, session revocation, no inherited data after re-registration.');
