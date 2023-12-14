import tls from 'node:tls';
import request from './request.mjs';
import convertHttpHeaders from './convertHttpHeaders.mjs';
import handleResponse from './handleResponse.mjs';

export default async ({
  hostname,
  path,
  port = 443,
  method = 'GET',
  body = null,
  headers,
  onChunk,
  onRequest,
  onResponse,
  ...other
}) => {
  const responseItem = await request(
    {
      path,
      method,
      headers: convertHttpHeaders(headers, hostname),
      body,
      onChunk,
      onRequest,
      onResponse,
    },
    () => tls.connect({
      host: hostname,
      port,
      ...other,
    }),
  );

  return handleResponse(responseItem);
};