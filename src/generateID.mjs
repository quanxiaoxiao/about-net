/**
 * @param {number} [max=2147483647]
 */
export default (max = 2147483647) => {
  const state = {
    current: 1,
    countLoops: 0,
  };

  return () => {
    const _id = state.current;
    state.current += 1;
    if (state.current >= max) {
      state.current = 1;
      state.countLoops += 1;
    }
    return _id;
  };
};
