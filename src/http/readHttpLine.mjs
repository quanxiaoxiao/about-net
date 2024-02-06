import assert from 'node:assert';
import { HttpParserError } from '../errors.mjs';

const MAX_LINE_SIZE = 65535;
const crlf = Buffer.from([0x0d, 0x0a]);

export default (
  buf,
  start = 0,
  statusCode = null,
  max = MAX_LINE_SIZE,
) => {
  if (statusCode != null) {
    assert(typeof statusCode === 'number');
    assert(statusCode > 0 && statusCode < 1000);
  }
  const len = buf.length;
  if (len === 0) {
    return null;
  }
  if (buf[start] === crlf[1]) {
    throw new HttpParserError('parse fail', statusCode);
  }
  if (len === 1) {
    return null;
  }
  if (start > len - 1) {
    throw new HttpParserError('start exceed buf size', statusCode);
  }
  let index = -1;
  let i = start;
  const end = Math.min(len, start + max + 1);
  while (i < end) {
    const b = buf[i];
    if (b === crlf[1]) {
      if (i === start || buf[i - 1] !== crlf[0]) {
        throw new HttpParserError('parse fail', statusCode);
      }
      index = i;
      break;
    }
    i++;
  }
  if (index === -1) {
    if (len - start >= max) {
      throw new HttpParserError('start exceed buf size', statusCode);
    }
    return null;
  }
  return buf.slice(start, index - 1);
};
