import { Buffer } from 'node:buffer';

export default (bitSize = 2) => {
  if (bitSize > 4) {
    throw new Error(`\`${bitSize}\` exceed max size 4`);
  }
  const state = {
    size: 0,
    payload: null,
    chunkSize: -1,
    buf: Buffer.from([]),
  };
  return (chunk) => {
    if (state.chunkSize !== -1
      && state.size - bitSize >= state.chunkSize) {
      throw new Error('already depack complete');
    }
    const len = chunk.length;
    if (len > 0) {
      state.size += len;
      state.buf = Buffer.concat([
        state.buf,
        chunk,
      ], state.size);
    }
    if (state.chunkSize === -1) {
      if (state.size < bitSize) {
        return null;
      }
      switch (bitSize) {
        case 1: {
          state.chunkSize = state.buf.readUint8(0);
          break;
        }
        case 2: {
          state.chunkSize = state.buf.readUint16BE(0);
          break;
        }
        case 4: {
          state.chunkSize = state.buf.readUint32BE(0);
          break;
        }
        default: {
          throw new Error(`\`${bitSize}\` unable handle`);
        }
      }
    }
    if (state.size - bitSize < state.chunkSize) {
      return null;
    }
    return {
      size: state.chunkSize,
      payload: state.buf.slice(bitSize, state.chunkSize + bitSize),
      buf: state.buf.slice(state.chunkSize + bitSize),
    };
  };
};
