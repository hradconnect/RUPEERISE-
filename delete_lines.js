import fs from 'fs';
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
// Indices are 0-based
// 521, 522, 523 are 520, 521, 522
lines.splice(520, 3);
// 525, 526 were shift up by 3, so they are now 522, 523 (index 521, 522)
lines.splice(521, 2);
fs.writeFileSync('src/App.tsx', lines.join('\n'));
