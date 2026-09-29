const fs = require('fs');
const path = require('path');

const filesToCopy = [
  'common.js',
  'app.js',
  'admin.js',
  'style.css',
  'robots.txt',
  'sitemap.xml'
];

const distDir = path.resolve(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

for (const file of filesToCopy) {
  const src = path.resolve(__dirname, file);
  const dest = path.resolve(distDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file} -> dist/${file}`);
  }
}
