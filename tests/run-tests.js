const fs = require('fs');
const path = require('path');

let failures = 0;

global.describe = (name, fn) => {
  console.log(`\nSuite: ${name}`);
  fn();
};

global.it = (name, fn) => {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failures += 1;
    console.error(`  ✗ ${name}`);
    console.error(err.stack || err);
  }
};

const testFiles = fs
  .readdirSync(__dirname)
  .filter((file) => file.endsWith('.test.js'))
  .map((file) => path.join(__dirname, file));

testFiles.forEach((file) => {
  require(file);
});

if (failures > 0) {
  console.error(`\n${failures} test(s) failed.`);
  process.exit(1);
} else {
  console.log('\nAll tests passed.');
}
