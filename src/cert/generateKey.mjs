import { existsSync, writeFileSync } from 'node:fs';
import { generateKeyPairSync } from 'node:crypto';

export default (pathname, modulusLength = 2048) => {
  if (existsSync(pathname)) {
    console.log(`generateKey fail, \`${pathname}\` already exist`);
    process.exit(1);
  }
  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength,
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });
  writeFileSync(pathname, privateKey);
  console.log(`\`${pathname}\` generateKey success`);
};
