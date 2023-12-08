import net from 'node:net';
import request from './request.mjs';
import handleResponse from './handleResponse.mjs';

export default async ({
  hostname,
  path,
  port = 80,
  method = 'GET',
  body = null,
  headers = {},
  onChunk,
  onRequest,
  onResponse,
}) => {
  const socket = new net.Socket();

  const responseItem = await request(
    {
      path,
      method,
      headers,
      body,
      onChunk,
      onRequest,
      onResponse,
    },
    () => {
      socket.connect({
        host: hostname,
        port,
      });
      return socket;
    },
  );

  return handleResponse(responseItem);
};
