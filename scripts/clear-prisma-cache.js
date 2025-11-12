// Script to clear Prisma Client cache
const fs = require('fs');
const path = require('path');

const cachePaths = [
  path.join(__dirname, '../.next'),
  path.join(__dirname, '../node_modules/.prisma'),
  path.join(__dirname, '../node_modules/@prisma/client'),
];

console.log('🧹 Clearing Prisma cache...\n');

cachePaths.forEach(cachePath => {
  if (fs.existsSync(cachePath)) {
    console.log(`Removing: ${cachePath}`);
    fs.rmSync(cachePath, { recursive: true, force: true });
  } else {
    console.log(`Skipping (not found): ${cachePath}`);
  }
});

console.log('\n✅ Cache cleared! Now run: npx prisma generate && npm run dev');

