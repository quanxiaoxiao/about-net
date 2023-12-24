import net from 'node:net';
import request from './request.mjs';
import handleResponse from './handleResponse.mjs';
import convertHttpHeaders from './convertHttpHeaders.mjs';

export default async ({
  hostname,
  path,
  port = 80,
  method = 'GET',
  body = null,
  headers,
  onChunk,
  onBody,
  onStartLine,
  onHeader,
  onRequest,
  onResponse,
}) => {
  const responseItem = await request(
    {
      path,
      method,
      headers: convertHttpHeaders(headers, hostname),
      body,
      onBody,
      onChunk,
      onStartLine,
      onHeader,
      onRequest,
      onResponse,
    },
    () => {
      const socket = new net.Socket();
      socket.connect({
        host: hostname,
        port,
      });
      return socket;
    },
  );

  return handleResponse(responseItem);
};
