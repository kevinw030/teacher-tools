// Makes a copy of index.html for every page, so clean addresses like edsidekick.com/games
// load straight away (GitHub Pages serves games.html for /games). Also writes 404.html,
// which shows the site for any address that has no file yet.
//
// Run after changing index.html or adding a page or game:   node scripts/make-pages.js
// (A GitHub Action also runs it on every push to main.)
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

// Page names and titles come from assets/app.js (titles) and the games in tools/*.js.
const pages = {};
const app = read('assets/app.js');
const t = app.match(/var titles = \{([^}]*)\}/);
if (!t) throw new Error('Could not find the page titles in assets/app.js');
for (const m of t[1].matchAll(/'?([a-z0-9-]+)'?\s*:\s*'([^']*)'/g)) pages[m[1]] = m[2];
for (const f of fs.readdirSync(path.join(root, 'tools'))) {
  if (!f.endsWith('.js')) continue;
  for (const m of read('tools/' + f).matchAll(/\{\s*id:\s*'([a-z0-9-]+)',\s*title:\s*'([^']*)',\s*desc:/g)) pages[m[1]] = m[2];
}
delete pages.home;

const shell = read('index.html');
const SITE = 'https://edsidekick.com';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
function pageFor(name, title) {
  const head = '<!-- Made from index.html by scripts/make-pages.js. Edit index.html, not this file. -->\n';
  let html = shell.replace(/<title>[^<]*<\/title>/, '<title>' + esc(title) + ' · ED Sidekick</title>');
  html = html.replace('</head>', '<link rel="canonical" href="' + SITE + '/' + name + '">\n</head>');
  return html.replace(/^<!doctype html>\n?/i, '<!doctype html>\n' + head);
}

const made = [];
for (const [name, title] of Object.entries(pages)) {
  if (name === 'index' || name === '404') continue;
  fs.writeFileSync(path.join(root, name + '.html'), pageFor(name, title));
  // A page that shares its name with a folder (would-you-rather/) also gets a copy inside it,
  // in case the host sends /name to /name/.
  if (fs.existsSync(path.join(root, name)) && fs.statSync(path.join(root, name)).isDirectory()) {
    fs.writeFileSync(path.join(root, name, 'index.html'), pageFor(name, title));
  }
  made.push(name);
}
// Remove copies for pages that no longer exist.
for (const f of fs.readdirSync(root)) {
  if (!f.endsWith('.html') || f === 'index.html' || f === '404.html') continue;
  const name = f.slice(0, -5);
  if (!pages[name] && /Made from index.html by scripts\/make-pages.js/.test(read(f))) fs.unlinkSync(path.join(root, f));
}
fs.writeFileSync(path.join(root, '404.html'), shell.replace(/^<!doctype html>\n?/i, '<!doctype html>\n<!-- Made from index.html by scripts/make-pages.js. Edit index.html, not this file. -->\n'));
console.log('Made ' + made.length + ' pages: ' + made.join(', '));
