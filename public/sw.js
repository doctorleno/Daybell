// No private calendar responses are cached. An installed app still needs an active session.
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",event=>event.waitUntil(self.clients.claim()));
self.addEventListener("fetch",event=>{
 if(event.request.mode==="navigate")event.respondWith(fetch(event.request).catch(()=>new Response(
 '<!doctype html><meta name="viewport" content="width=device-width"><title>Daybell offline</title><h1>Daybell is offline</h1><p>Reconnect to securely load your calendar. Browser alarms require the app to stay running.</p><button onclick="location.reload()">Retry</button>',
 {headers:{"Content-Type":"text/html"}})));
});
