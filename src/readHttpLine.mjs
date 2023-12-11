const MAX_LINE_SIZE = 65535;
const crlf = Buffer.from([0x0d, 0x0a]);

export default (
  buf,
  start = 0,
  name = '',
  max = MAX_LINE_SIZE,
) => {
  const len = buf.length;
  if (len === 0) {
    return null;
  }
  if (buf[start] === crlf[1]) {
    throw new Error(`parse ${name} fail`);
  }
  if (len === 1) {
    return null;
  }
  if (start > len - 1) {
    throw new Error('start exceed buf size');
  }
  let index = -1;
  let i = start;
  const end = Math.min(len, start + max + 1);
  while (i < end) {
    const b = buf[i];
    if (b === crlf[1]) {
      if (i === start || buf[i - 1] !== crlf[0]) {
        throw new Error(`parse \`${name}\` fail`);
      }
      index = i;
      break;
    }
    i++;
  }
  if (index === -1) {
    if (len - start >= max) {
      throw new Error(`parse \`${name}\` fail`);
    }
    return null;
  }
  return {
    chunk: buf.slice(start, index - 1),
    size: index - 1,
  };
};
