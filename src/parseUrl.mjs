import { parse } from 'node:url';

/**
 *  @typedef {Object} Obj
 *  @property {string} protocol
 *  @property {number} port
 *  @property {string} path
 *  @property {string} hostname
 */

/**
 * @param {string} href
 * @returns {Obj}
 */
export default (href) => {
  if (!/^https?:\/\/\w+/.test(href)) {
    throw new Error(`href \`${href}\` invalid`);
  }
  const {
    protocol,
    path,
    port,
    hostname,
  } = parse(href);
  if (!hostname) {
    throw new Error(`href \`${href}\` invalid`);
  }
  if (protocol !== 'https:' && protocol !== 'http:') {
    throw new Error(`protocol \`${protocol}\` unspport`);
  }

  let p = port ? Number(port) : null;
  if (p == null) {
    p = protocol === 'https:' ? 443 : 80;
  }
  if (p <= 0 || p > 65535 || Number.isNaN(p)) {
    throw new Error(`port \`${p}\` invalid`);
  }
  return {
    protocol,
    hostname,
    port: p,
    path: path || '/',
  };
};
