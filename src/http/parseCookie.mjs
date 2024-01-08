export default (str) => {
  const data = (str || '')
    .split(';')
    .map((s) => {
      const [key, value] = s.split('=');
      return {
        key: key.trim(),
        value: decodeURIComponent(value || '').trim(),
      };
    })
    .reduce((acc, cur) => {
      if (cur.key === '') {
        return acc;
      }
      return {
        ...acc,
        [cur.key]: cur.value,
      };
    }, {});
  return data;
};
