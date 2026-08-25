/**
 * Direct SQLite migration: update /uploads/ → /bags/ paths in the database
 * Uses better-sqlite3 for direct file access without Prisma path resolution issues
 */
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
console.log('Opening DB at:', dbPath);

const db = new Database(dbPath);

// Show current state
const catsBefore = db.prepare("SELECT name, image FROM Category").all();
const imgsBefore = db.prepare("SELECT imageUrl FROM ProductImage LIMIT 5").all();
console.log('\nBEFORE:');
catsBefore.forEach(c => console.log(' CAT:', c.name, '→', c.image));
imgsBefore.forEach(i => console.log(' IMG:', i.imageUrl));

// Run migration
const updateImages = db.prepare("UPDATE ProductImage SET imageUrl = REPLACE(imageUrl, '/uploads/', '/bags/') WHERE imageUrl LIKE '/uploads/%'");
const updateCats = db.prepare("UPDATE Category SET image = REPLACE(image, '/uploads/', '/bags/') WHERE image LIKE '/uploads/%'");

const imgResult = updateImages.run();
const catResult = updateCats.run();

console.log('\nMigrated:', imgResult.changes, 'product images,', catResult.changes, 'category images');

// Verify
const catsAfter = db.prepare("SELECT name, image FROM Category").all();
const imgsAfter = db.prepare("SELECT imageUrl FROM ProductImage LIMIT 5").all();
console.log('\nAFTER:');
catsAfter.forEach(c => console.log(' ✓ CAT:', c.name, '→', c.image));
imgsAfter.forEach(i => console.log(' ✓ IMG:', i.imageUrl));

db.close();
console.log('\n✅ Migration complete');
