import tls from 'node:tls';
import net from 'node:net';
import request from './request.mjs';
import convertHttpHeaders from './convertHttpHeaders.mjs';

export default async ({
  _id,
  hostname,
  path,
  port = 443,
  method = 'GET',
  body = null,
  headers,
  signal,
  onBody,
  onIncoming,
  onOutgoing,
  onStartLine,
  onHeader,
  onRequest,
  onResponse,
  servername,
  ...other
}) => {
  const responseItem = await request(
    {
      _id,
      path,
      method,
      headers: convertHttpHeaders(headers, hostname),
      body,
      signal,
      onIncoming,
      onOutgoing,
      onBody,
      onRequest,
      onResponse,
    },
    () => {
      const options = {
        host: hostname,
        servername,
        port,
        secureContext: tls.createSecureContext({
          secureProtocol: 'TLSv1_2_method',
        }),
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

  return responseItem;
};
