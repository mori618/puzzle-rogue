const fs = require('fs');
const file = 'src/constants/tokens.js';
let content = fs.readFileSync(file, 'utf8');

let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  
  if (line.match(/name:\s*["'].+?["']/)) {
    if (line.includes('{') && line.includes('}') && !line.includes('icon:')) {
      lines[i] = line.replace(/(name:\s*["'][^"']+["'],?)/, '$1 icon: "extension",');
    } 
    else if (!line.includes('{') || !line.includes('}')) {
       let hasIcon = false;
       let start = i;
       while (start >= 0 && !lines[start].includes('{')) start--;
       if (start < 0) start = 0;
       
       let end = i;
       while (end < lines.length && !lines[end].includes('}')) end++;
       if (end >= lines.length) end = lines.length - 1;
       
       for (let k = start; k <= end; k++) {
         if (lines[k] && lines[k].includes('icon:')) {
           hasIcon = true;
         }
       }
       
       if (!hasIcon) {
         lines[i] = line.replace(/(name:\s*["'][^"']+["'],?)/, '$1 icon: "extension",');
       }
    }
  }
}

fs.writeFileSync(file, lines.join('\n'));
console.log('Done adding icons');
