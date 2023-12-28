import { Buffer } from 'node:buffer';
/**
 * @param {string|Buffer} b
 * @returns {Buffer}
 */
export default (b) => {
  if (Buffer.isBuffer(b)) {
    return b;
  }
  if (typeof b === 'string') {
    return Buffer.from(b);
  }
  throw new Error('data invalid');
};
