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
  const headerList = [];
  if (!Array.isArray(data)) {
    headerList.push(...convertObjToArray(data));
  } else {
    for (let i = 0; i < data.length;) {
      const key = data[i];
      const value = data[i + 1];
      headerList.push(key);
      headerList.push(value);
      i += 2;
    }
  }

  const result = [];

  for (let i = 0; i < headerList.length;) {
    const key = headerList[i];
    const value = headerList[i + 1];
    if (!/^host$/i.test(key)) {
      result.push(key);
      result.push(value);
    }
    i += 2;
  }

  return [
    'Host',
    hostname,
    ...result,
  ];
};
