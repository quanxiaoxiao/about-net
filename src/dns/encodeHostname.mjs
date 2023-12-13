export default (str) => {
  const hostname = str.trim();
  if (hostname === '') {
    throw new Error('hostname is empty');
  }
  const bufList = [];
  const nameList = hostname.split('.');
  for (let i = 0; i < nameList.length; i++) {
    const name = nameList[i];
    const size = name.length;
    if (size === 0) {
      throw new Error('name is empty');
    }
    if (size > 255) {
      throw new Error('name size exceed length 255');
    }
    const sizeBuf = Buffer.allocUnsafe(1);
    sizeBuf.writeUInt8(size);
    bufList.push(sizeBuf);
    bufList.push(Buffer.from(name));
  }
  bufList.push(Buffer.from([0]));
  return Buffer.concat(bufList);
};
