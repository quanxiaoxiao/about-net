export default (headers, keys) => {
  if (!Array.isArray(headers)) {
    throw new Error('headers is not array');
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
