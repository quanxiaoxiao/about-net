import assert from 'node:assert';

export default (headers, keys) => {
  assert(Array.isArray(headers));
  if (keys.length === 0) {
    return headers;
  }
  const regexp = new RegExp(`^${keys.join('|')}$`, 'i');
  const result = [];
  for (let i = 0; i < headers.length;) {
    const key = headers[i];
    const value = headers[i + 1];
    if (!regexp.test(key)) {
      result.push(key);
      result.push(value);
    }
    i += 2;
  }
  return result;
};
