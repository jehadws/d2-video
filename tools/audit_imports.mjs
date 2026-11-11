import fs from 'fs';
const ROOT = process.argv[2] || 'projects/what-if-you-got-1-every-push-up';
const files = fs.readdirSync(ROOT + '/scenes/shots').map(f => ROOT + '/scenes/shots/' + f)
  .concat(fs.readdirSync(ROOT + '/scenes/sets').map(f => ROOT + '/scenes/sets/' + f));
const NAMES = ['E','V','S','mood','layer','blurLayer','veil','backdrop','rr','seg','poly','circle','ring',
  'linGrad','alpha','shade','glow','mix','ease','prog','clamp','lerp','wordTime','text','measure','FONTS','rng',
  'dollar','tag','stamp','counter','vignetteFocus','palm','confetti','beat','countTo','drawFigure','bigFace',
  'breathe','walkPose','pushupPose','posesAt','POSES','lineFigure','callout','badge','bigLine','bubble','endScreen'];
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const imported = new Set();
  for (const m of src.matchAll(/import\s*\{([^}]+)\}\s*from/g))
    m[1].split(',').forEach(n => { const t = n.trim().split(/\s+as\s+/); if (t[0]) imported.add((t[1] || t[0]).trim()); });
  for (const m of src.matchAll(/import\s*\*\s*as\s+(\w+)/g)) imported.add(m[1]);
  const missing = new Set();
  for (const name of NAMES) {
    if (imported.has(name)) continue;
    const re = new RegExp('(?<![\\w.$])' + name + '\\s*\\(', 'g');
    let m;
    while ((m = re.exec(src))) {
      const before = src.slice(Math.max(0, m.index - 80), m.index);
      if (/function\s*$/.test(before)) continue; // its own definition
      if (new RegExp('(function\\s+' + name + '\\s*\\(|const\\s+' + name + '\\s*=|let\\s+' + name + '\\s*=)').test(src)) continue; // defined locally
      missing.add(name);
      break;
    }
  }
  if (missing.size) console.log(f + ': MISSING ' + [...missing].join(', '));
}
console.log('audit done');
