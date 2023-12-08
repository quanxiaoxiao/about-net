const now = Date.now();
const start = performance.now();

export default () => now + (performance.now() - start);
