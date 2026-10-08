const fs = require('fs');
const zlib = require('zlib');
const sharp = require('C:/Users/skale/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const [source, output] = process.argv.slice(2);
let svg = fs.readFileSync(source);
if (svg[0] === 31 && svg[1] === 139) svg = zlib.gunzipSync(svg);
svg = Buffer.from(svg.toString().replace(/ns0:/g, '').replace(/xmlns:ns0=/g, 'xmlns='));
sharp(svg, {density: 200}).resize({width: 900}).flatten({background: '#ffffff'}).png().toFile(output).catch(e => {console.error(e); process.exit(1);});
