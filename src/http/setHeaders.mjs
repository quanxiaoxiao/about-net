import convertObjToArray from './convertObjToArray.mjs';

export default (headers, obj) => {
  const keys = Object.keys(obj);
  if (keys.length === 0) {
    return headers;
  }
  const arr = Array.isArray(headers) ? headers : convertObjToArray(headers);
  const regexp = new RegExp(`^${keys.join('|')}$`, 'i');
  const result = [];
  for (let i = 0; i < arr.length;) {
    const key = arr[i];
    const value = arr[i + 1];
    if (!regexp.test(key)) {
      result.push(key);
      result.push(value);
    }
    i += 2;
  }
  return result.concat(convertObjToArray(obj));
};
