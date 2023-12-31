/**
 * @typedef {Object<string, string | Array<string>>} KeyValueObj
 */

/**
 * @param {KeyValueObj} obj
 * @returns {Array<string>}
 */
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

/**
 * @param {KeyValueObj | Array<string>} [data]
 * @param {string} [hostname='']
 * @returns {Array<string>}
 */
export default (data, hostname = '') => {
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
    const arr = convertObjToArray(data || {});
    if (arr.length > 0) {
      headerList.push(...arr);
    }
  } else {
    for (let i = 0; i < data.length;) {
      const key = data[i];
      const value = data[i + 1];
      headerList.push(key);
      headerList.push(value);
      i += 2;
    }
  }

  for (let i = 0; i < headerList.length;) {
    const key = headerList[i];
    if (/^host$/i.test(key)) {
      return headerList;
    }
    i += 2;
  }

  return [
    'Host',
    hostname,
    ...headerList,
  ];
};
