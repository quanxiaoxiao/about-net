import net from 'node:net';
import request from './request.mjs';
import handleResponse from './handleResponse.mjs';
import convertHttpHeaders from './convertHttpHeaders.mjs';

export default async ({
  _id,
  hostname,
  path,
  port = 80,
  method = 'GET',
  body = null,
  headers,
  onBody,
  onIncoming,
  onOutgoing,
  onStartLine,
  onHeader,
  onRequest,
  onResponse,
}) => {
  const responseItem = await request(
    {
      _id,
      path,
      method,
      headers: convertHttpHeaders(headers, hostname),
      body,
      onBody,
      onStartLine,
      onHeader,
      onRequest,
      onResponse,
      onIncoming,
      onOutgoing,
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
