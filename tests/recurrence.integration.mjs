import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://localhost:5184';const run=process.env.TEST_RUN_ID||Date.now();const password='recurrence-test-1234567!';const users=[];
async function call(path,data,cookie='',method=data?'POST':'GET'){const r=await fetch(base+path,{method,headers:{Origin:base,Cookie:cookie,'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});const body=await r.json();return {status:r.status,body,cookie:r.headers.get('set-cookie')?.split(';')[0]||''};}
try{
for(const letter of ['a','b']){const s=await call('/api/auth/signup',{email:`repeat-${letter}-${run}@example.invalid`,password,name:'Recurrence test'});assert.equal(s.status,200,JSON.stringify(s.body));users.push(s.cookie);}
const event={title:'Every Monday and Wednesday',kind:'task',starts:'2026-10-05T13:00:00Z',minutes:15,sound:'Bell',notes:'test',done:0,recurrence:{frequency:'weekly',interval:1,weekdays:[1,3],until:'2026-12-31',timezone:'America/New_York'}};
const saved=await call('/api/entries',event,users[0]);assert.equal(saved.status,201);const id=saved.body.id;
assert.equal((await call('/api/entries',{id,occurrence:'2026-10-05',done:1},users[1])).status,404);
assert.equal((await call('/api/entries',{id,occurrence:'2026-10-06',done:1},users[0])).status,400);
assert.equal((await call('/api/entries',{id,occurrence:'2026-10-05',done:1},users[0])).status,200);
let list=(await call('/api/entries',undefined,users[0])).body;assert.deepEqual(list[0].completed,['2026-10-05']);assert.equal(list[0].done,0);assert.deepEqual(list[0].recurrence.weekdays,[1,3]);
assert.equal((await call('/api/entries',undefined,users[1])).body.length,0);
assert.equal((await call('/api/entries',{id,occurrence:'2026-10-05',done:0},users[0])).status,200);
assert.equal((await call('/api/entries',undefined,users[0])).body[0].completed.length,0);
// Older clients omit recurrence: preserve the series when changing other fields.
const {recurrence,...legacy}=event;assert.equal((await call('/api/entries',{...legacy,id},users[0])).status,200);
assert.ok((await call('/api/entries',undefined,users[0])).body[0].recurrence);
assert.equal((await call('/api/entries',{...event,recurrence:{...event.recurrence,weekdays:[]}},users[0])).status,400);
assert.equal((await call('/api/entries?id='+id,undefined,users[0],'DELETE')).status,200);
assert.equal((await call('/api/entries',undefined,users[0])).body.length,0);
console.log('PASS: recurrence storage, owner isolation, date validation, per-occurrence completion and series deletion.');
}finally{for(const cookie of users){const r=await call('/api/account',{password},cookie,'DELETE');assert.equal(r.status,200);}}
