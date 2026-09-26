# Daybell personal alarm audio


## Personal alarm audio (September 26, 2026)
Choose Ringtone > My audio in an event editor, then select a playable local audio file (maximum 15 MB). Preview plays up to 10 seconds; Stop preview ends it earlier. One preferred file per account per browser/device is stored in IndexedDB and never uploaded. Replacing it changes all My audio alarms on that device. Audio must be selected separately on another device; clearing app/browser data removes it. Missing or unreadable custom audio falls back to Chime. Streaming-service protected downloads are not supported.

Web and Windows alarms loop until Stop ringing while the app is running; browser suspension or computer sleep can prevent alarms. The Windows installer already loads the updated Cloudflare web app. Mobile source includes file selection and foreground custom playback, with built-in Chime for background/closed-app notifications. Mobile native behavior still needs physical-device testing, signing, and store review; this archive is source, not a published store download.

Verified: web and mobile type checks/builds, recurrence tests, looping/stop race tests, audio account-key isolation and validation tests, browser file selection and persistence after reload, and live API custom sound save/read validation.
