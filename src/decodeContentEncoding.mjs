import { unzipSync, brotliDecompress } from 'node:zlib';

export default async (encoding, chunk) => {
  if (!chunk || chunk.length === 0) {
    return Buffer.from([]);
  }

  if (/^gzip$/i.test(encoding)) {
    return unzipSync(chunk);
  }

  if (/^br$/i.test(encoding)) {
    const dataBuf = await new Promise((resolve, reject) => {
      brotliDecompress(chunk, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
    return dataBuf;
  }

  return chunk;
};
