const decodeHostname = (buf, chunk) => {
  if (buf.length === 0) {
    return [];
  }
  const nameList = [];
  let nameSize = buf.readUint8(0);
  let offset = 1;
  while (nameSize !== 0
    && buf.length > offset
  ) {
    if (nameSize === 0xc0) {
      const skip = buf.readUint16BE(offset - 1) - 0xc000;
      if (skip > chunk.length) {
        throw new Error('parse fail');
      }
      nameList.push(...decodeHostname(chunk.slice(skip), chunk));
      break;
    } else {
      const nameBuf = buf.slice(offset, offset + nameSize);
      nameList.push(nameBuf);
      offset += nameSize;
      if (offset >= buf.length) {
        break;
      }
      nameSize = buf.readUint8(offset);
      offset += 1;
    }
  }
  return nameList;
};

export default decodeHostname;
