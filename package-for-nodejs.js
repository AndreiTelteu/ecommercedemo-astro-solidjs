const fs = require('fs').promises;
process.exitCode = 1

async function handle() {
  try {
    let filename = './astro.config.mjs';
    const data = await fs.readFile(filename, 'utf8');
    const result = data.replace(/adapter: netlify\(\)/ig, 'adapter: node()');
    await fs.writeFile(filename, result,'utf8');
    process.exitCode = 0;
  } catch (e) {
    console.log(e.message, e.stack);
  }
  return true;
}
handle().then(() => {
  process.exit();
});
