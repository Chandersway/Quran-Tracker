import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// This numeric App Store Connect app ID is neither a bundle ID nor an Apple team ID.
const appId = process.env.ASC_APP_ID?.trim();
if (!appId || !/^[1-9][0-9]{0,19}$/.test(appId)) {
  console.error('Set ASC_APP_ID to the numeric App Store Connect app ID in production secrets.');
  process.exit(1);
}
const file = fileURLToPath(new URL('../eas.json', import.meta.url));
const config = JSON.parse(readFileSync(file, 'utf8'));
if (!config.submit?.production) {
  console.error('eas.json must define submit.production before preparing an iOS submission.');
  process.exit(1);
}
config.submit.production.ios = { ...config.submit.production.ios, ascAppId: appId };
writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
console.log('Prepared the explicit App Store Connect app ID for this submission.');
