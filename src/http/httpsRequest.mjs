import tls from 'node:tls';
import net from 'node:net';
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
  servername,
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
    () => {
      const options = {
        host: hostname,
        servername,
        port,
        ...other,
      };
      if (!options.servername) {
        if (net.isIP(hostname) === 0) {
          options.servername = hostname;
        }
      }
      return tls.connect(options);
    },
  );

  return handleResponse(responseItem);
};
