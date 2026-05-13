const fs = require('fs');

function replaceAll(file, replacer) {
  let c = fs.readFileSync(file, 'utf8');
  c = replacer(c);
  fs.writeFileSync(file, c);
}

// In my previous scripts, I somehow didn't correctly match the original file contents. Let me look at the content.
