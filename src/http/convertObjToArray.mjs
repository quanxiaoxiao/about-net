export default (obj) => {
  const result = [];
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = obj[key];
    if (Array.isArray(value)) {
      for (let j = 0; j < value.length; j++) {
        result.push(key);
        result.push(value[j]);
      }
    } else {
      result.push(key);
      result.push(value);
    }
  }
  return result;
};
