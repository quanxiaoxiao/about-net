import { resolve } from 'node:path';
import {
  writeFileSync,
  unlinkSync,
  existsSync,
} from 'node:fs';
import { randomBytes } from 'node:crypto';
import { execSync } from 'node:child_process';
import genereateIssuers from './genereateIssuers.mjs';

export default ({
  dayCount,
  issuers,
  dnsList,
  ipList,
  rootCAKeyPathname,
  rootCACertPathname,
  keyPathname,
  certPathname,
}) => {
  if (!existsSync(rootCACertPathname)) {
    console.log(`generateCertificate fail, root cert \`${rootCACertPathname}\` not exist`);
    process.exit(1);
  }

  if (!existsSync(rootCAKeyPathname)) {
    console.log(`generateCertificate fail, root cert key \`${rootCACertPathname}\` not exist`);
    process.exit(1);
  }

  if (!existsSync(keyPathname)) {
    console.log(`generateCertificate fail, cert key \`${keyPathname}\` not exist`);
    process.exit(1);
  }

  const certReqPathname = resolve(process.cwd(), `${randomBytes(12).toString('hex')}.csr`);
  const commandWithCreateCertReq = [
    'openssl',
    'req',
    '-new',
    `-key "${keyPathname}"`,
    `-subj "${genereateIssuers(issuers)}"`,
    `-out ${certReqPathname}`,
  ].join(' ');

  let willSetExt = false;

  if (Array.isArray(dnsList) && dnsList.length > 0) {
    willSetExt = true;
  }

  if (!willSetExt && Array.isArray(ipList) && ipList.length > 0) {
    willSetExt = true;
  }

  execSync(commandWithCreateCertReq);

  if (!existsSync(certReqPathname)) {
    console.log(`generateCertificate fail, cert req \`${certReqPathname}\` not exist`);
    process.eixt(1);
  }

  const extFilePathname = resolve(process.cwd(), `${randomBytes(12).toString('hex')}.conf`);

  if (willSetExt) {
    const extFileContent = [
      'authorityKeyIdentifier=keyid,issuer',
      'basicConstraints=CA:FALSE',
      'keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment',
      'extendedKeyUsage = serverAuth, clientAuth, codeSigning, emailProtection',
      'subjectAltName = @alt_names',
      '',
      '[alt_names]',
      ...(dnsList || []).map((s, i) => `DNS.${i + 1} = ${s}`),
      ...(ipList || []).map((s, i) => `IP.${i + 1} = ${s}`),
    ].join('\n');

    writeFileSync(extFilePathname, extFileContent);
  }

  const commandWithCreateCert = [
    'openssl',
    'x509',
    '-req',
    '-nodes',
    `-in ${certReqPathname}`,
    `-CA ${rootCACertPathname}`,
    `-CAkey ${rootCAKeyPathname}`,
    `-days ${dayCount}`,
    '-sha256',
    `-out ${certPathname}`,
    ...willSetExt ? [`-extfile ${extFilePathname}`] : [],
  ].join(' ');

  execSync(commandWithCreateCert);

  if (willSetExt) {
    unlinkSync(extFilePathname);
  }
  unlinkSync(certReqPathname);
  if (existsSync(certPathname)) {
    console.log(`\`${certPathname}\` generateCertificate success`);
  }
};
