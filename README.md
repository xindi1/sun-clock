# Sun Clock

An ambient solar time instrument built around sunrise, sunset, daylight, and the arc of the year.

## GitHub Pages deploy

Upload these files to the root of the GitHub Pages repo:

- `index.html`
- `manifest.webmanifest`
- `manifest.json`
- `sw.js`
- `sunclock-192.png`
- `sunclock-512.png`

Then commit and push.

If the old version still appears, hard refresh the browser or remove/reinstall the PWA from the phone home screen. The service worker cache name is `sun-clock-modern-v1`; increment it in `sw.js` when forcing a future cache refresh.
