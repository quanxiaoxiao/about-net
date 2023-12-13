export default (procedures) => {
  const state = {
    index: 0,
    offset: 0,
    size: 0,
    buf: Buffer.from([]),
    payload: {},
  };

  return (chunk) => {
    if (state.index === procedures.length) {
      throw new Error('parse already complete');
    }
    if (chunk.length > 0) {
      state.size += chunk.length;
      state.buf = Buffer.concat([
        state.buf,
        chunk,
      ], state.size);
    }
    while (state.index < procedures.length
      && state.size > state.offset
    ) {
      const handler = procedures[state.index];
      if (typeof handler === 'function') {
        const ret = handler(
          state.buf.slice(state.offset),
          state.payload,
          chunk,
        );
        if (!ret) {
          break;
        }
        const [offset, skip] = ret;
        state.offset += offset;
        if (skip > 0) {
          state.index = skip;
        } else if (skip < 0) {
          state.index += skip;
        } else {
          state.index += 1;
        }
      } else {
        const sizeRead = typeof handler.size === 'function' ? handler.size(state.payload) : handler.size;
        if (state.size - state.offset < sizeRead || state.size === state.offset) {
          break;
        }
        handler.fn(
          state.buf.slice(state.offset, state.offset + sizeRead),
          state.payload,
          chunk,
        );
        state.offset += sizeRead;
        state.index += 1;
      }
    }
    return state.payload;
  };
};
