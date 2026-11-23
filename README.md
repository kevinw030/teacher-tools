# ED Sidekick

Classroom tools for the board: Classroom Board, Timer, Name Picker, Group Maker, Name Wheel, Classroom Pet, team games and a daily Would You Rather.

Live site: https://edsidekick.com

Page addresses: every page has a clean address (edsidekick.com/games). The site is one page (index.html); `scripts/make-pages.js` copies it to games.html, timer.html and so on so those addresses load directly. Edit index.html only, then run `node scripts/make-pages.js` (a GitHub Action also runs it on every push to main). In code, use `TT.page()` to read the current page, `TT.go(name)` to change page, link with `href="/name"`, listen for the `tt:page` event, and use addresses that start with `/` for files (`/assets/...`).

- Everything runs in the browser. Class lists, links and board layouts are saved only on the computer you use.
- Would You Rather questions live in `would-you-rather/questions.js`, one per line.
