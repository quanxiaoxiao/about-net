import net from 'node:net';
import request from './request.mjs';
import handleResponse from './handleResponse.mjs';

const generateHttpHeaders = (data, hostname) => {
  if (!hostname && !data) {
    return [];
  }
  if (hostname && !data) {
    return ['Host', hostname];
  }
  const arr = [];
  if (!Array.isArray(data)) {
    const keys = Object.keys(data);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = data[key];
      if (Array.isArray(value)) {
        for (let j = 0; j < value.length; j++) {
          arr.push(key);
          arr.push(`${value[j]}`);
        }
      } else {
        arr.push(key);
        arr.push(`${value}`);
      }
    }
  } else {
    for (let i = 0; i < data.length;) {
      const key = data[i];
      const value = data[i + 1];
      i += 2;
      arr.push(key);
      arr.push(`${value}`);
    }
  }

  for (let i = 0; i < arr.length;) {
    const key = arr[i];
    if (/^host$/i.test(key)) {
      return arr;
    }
    i += 2;
  }

  return [
    'Host',
    hostname,
    ...arr,
  ];
};

export default async ({
  hostname,
  path,
  port = 80,
  method = 'GET',
  body = null,
  headers,
  onChunk,
  onRequest,
  onResponse,
}) => {
  const socket = new net.Socket();
  const options = {
    path,
    method,
    headers,
    body,
    onChunk,
    onRequest,
    onResponse,
  };

  const responseItem = await request(
    options,
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
