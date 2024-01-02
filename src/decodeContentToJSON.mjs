import qs from 'node:querystring';
import decodeContentEncoding from './decodeContentEncoding.mjs';

export default async (headers, chunk) => {
  if (!chunk
    || chunk.length === 0
    || !/application\/(json|x-www-form-urlencoded)/i.test(headers['content-type'])
  ) {
    return null;
  }
  try {
    const content = await decodeContentEncoding(
      headers['content-encoding'],
      chunk,
    );
    if (/\/json/i.test(headers['content-type'])) {
      return JSON.parse(content.toString());
    }
    return qs.parse(content.toString());
  } catch (error) {
    return null;
  }
};
