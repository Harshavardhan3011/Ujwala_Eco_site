// Adds `export const dynamic = 'force-dynamic';` to ALL API route files missing it
const fs = require('fs');
const path = require('path');

function walk(dir, files = []) {
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) walk(full, files);
    else if (item === 'route.ts') files.push(full);
  }
  return files;
}

const routes = walk(path.join(process.cwd(), 'src/app/api'));
for (const absPath of routes) {
  let content = fs.readFileSync(absPath, 'utf-8');
  if (content.includes('force-dynamic')) {
    console.log('OK:', absPath.split('api')[1]);
    continue;
  }
  // Find position after last import line
  const lines = content.split('\n');
  let lastImportIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ')) lastImportIdx = i;
  }
  if (lastImportIdx >= 0) {
    lines.splice(lastImportIdx + 1, 0, "\nexport const dynamic = 'force-dynamic';");
    fs.writeFileSync(absPath, lines.join('\n'), 'utf-8');
    console.log('FIXED:', absPath.split('api')[1]);
  }
}
console.log('Done - all API routes now have force-dynamic');
