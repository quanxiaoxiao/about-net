import qs from 'node:querystring';
import decodeContentEncoding from './decodeContentEncoding.mjs';

export default async (responseItem) => {
  if (responseItem.body.length > 0
    && /application\/(json|x-www-form-urlencoded)/.test(responseItem.headers['content-type'])
  ) {
    const content = await decodeContentEncoding(
      responseItem.headers['content-encoding'],
      responseItem.body,
    );
    try {
      if (/\/json/.test(responseItem.headers['content-type'])) {
        const data = JSON.parse(content.toString());
        return {
          ...responseItem,
          data,
        };
      }
    } catch (error) {
      return responseItem;
    }

    return {
      ...responseItem,
      data: qs.parse(content.toString()),
    };
  }

  return responseItem;
};
