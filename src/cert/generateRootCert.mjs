import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import genereateIssuers from './genereateIssuers.mjs';

export default ({
  dayCount,
  issuers,
  rootCAKeyPathname,
  rootCACertPathname,
}) => {
  if (existsSync(rootCACertPathname)) {
    console.log(`generateRootCert fail, \`${rootCACertPathname}\` already exist`);
    process.exit(1);
  }
  if (!existsSync(rootCAKeyPathname)) {
    console.log(`generateRootCert fail, \`${rootCACertPathname}\` key is not exist`);
    process.exit(1);
  }
  const command = [
    'openssl',
    'req',
    '-new',
    '-x509',
    '-nodes',
    '-sha256',
    '-key',
    rootCAKeyPathname,
    `-days ${dayCount}`,
    `-subj "${genereateIssuers(issuers)}"`,
    `-out ${rootCACertPathname}`,
  ];

  execSync(command.join(' '));
  if (existsSync(rootCACertPathname)) {
    console.log(`\`${rootCACertPathname}\` generateRootCert success`);
  }
};
