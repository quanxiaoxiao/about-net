import tls from 'node:tls';
import net from 'node:net';
import request from './request.mjs';
import generateRequestOptions from './generateRequestOptions.mjs';

export default async ({
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
      ...generateRequestOptions({
        hostname,
        path,
        method,
        headers,
        body,
      }),
      signal,
      onStartLine,
      onHeader,
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
