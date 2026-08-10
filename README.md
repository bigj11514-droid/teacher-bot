# Teacher Bot

Static learning site for Y_Cohde students. Open any of the HTML pages directly in a
browser; all behaviour lives in `teacherbot.js`.

## Tests

Unit tests run with Jest in a jsdom environment. `teacherbot.js` is loaded through a
small helper (`tests/helpers/loadTeacherBot.js`) that builds a fresh DOM, seeds the
student session and stubs `window.location` so navigation can be asserted.

```bash
npm install
npm test            # run the unit tests
npm run test:coverage   # run them with a coverage report
```
