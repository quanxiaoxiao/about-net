const convertObjToArray = (obj) => {
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

export default (data, hostname) => {
  if (!hostname && !data) {
    return [];
  }
  if (hostname && !data) {
    return ['Host', hostname];
  }
  if (data && !hostname) {
    if (Array.isArray(data)) {
      return data;
    }
    return convertObjToArray(data);
  }
  const result = [];
  if (!Array.isArray(data)) {
    result.push(...convertObjToArray(data));
  } else {
    for (let i = 0; i < data.length;) {
      const key = data[i];
      const value = data[i + 1];
      result.push(key);
      result.push(value);
      i += 2;
    }
  }

  for (let i = 0; i < result.length;) {
    const key = result[i];
    if (/^host$/i.test(key)) {
      return result;
    }
    i += 2;
  }

  return [
    'Host',
    hostname,
    ...result,
  ];
};
