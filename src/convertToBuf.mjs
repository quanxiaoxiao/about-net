export default (b) => {
  if (Buffer.isBuffer(b)) {
    return b;
  }
  if (typeof b === 'string') {
    return Buffer.from(b);
  }
  throw new Error('data invalid');
};
