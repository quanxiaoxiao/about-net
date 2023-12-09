/* eslint no-nested-ternary: 0 */
import http from 'node:http';
import convertHttpHeaders from './convertHttpHeaders.mjs';
import filterHttpHeaders from './filterHttpHeaders.mjs';

const crlf = Buffer.from('\r\n');
const HTTP_VERSION = '1.1';

const generateHeadersBuf = (arr) => {
  const result = [];
  for (let i = 0; i < arr.length;) {
    const key = arr[i];
    const value = arr[i + 1];
    result.push(Buffer.from(`${key}: ${value == null ? '' : value}`));
    result.push(crlf);
    i += 2;
  }
  return Buffer.concat(result);
};

const encodeHttp = (options) => {
  const state = {
    completed: false,
    contentSize: 0,
  };

  const {
    headers,
    path,
    method,
    body,
    statusCode,
    statusText,
    onStartLine,
    onHeader,
    onEnd,
    httpVersion = HTTP_VERSION,
  } = options;

  const keyValuePairList = filterHttpHeaders(
    convertHttpHeaders(headers),
    ['content-length', 'transfer-encoding'],
  );

  const hasBody = Object.hasOwnProperty.call(options, 'body');

  if (hasBody) {
    if (body == null) {
      state.contentLength = 0;
    } else if (typeof body === 'string') {
      state.contentLength = Buffer.from(body).length;
    } else if (Buffer.isBuffer(body)) {
      state.contentLength = body.length;
    } else {
      throw new Error('body is invalid');
    }
    if (state.contentLength !== 0) {
      keyValuePairList.push('Content-Length');
      keyValuePairList.push(state.contentLength);
    }
  }

  const startLines = [];
  const isRequest = method != null;

  if (isRequest) {
    startLines.push(method.toUpperCase());
    startLines.push(path || '/');
    startLines.push(`HTTP/${httpVersion}`);
  } else {
    const code = statusCode == null ? 200 : statusCode;
    startLines.push(`HTTP/${httpVersion}`);
    startLines.push(`${code}`);
    startLines.push(statusText == null ? (http.STATUS_CODES[code] || '') : statusText);
  }

  const startlineBuf = Buffer.from(startLines.join(' '));

  if (onStartLine) {
    onStartLine(startlineBuf);
  }

  if (hasBody) {
    const headersBuf = generateHeadersBuf(keyValuePairList);
    if (onHeader) {
      if (!onStartLine) {
        onHeader(Buffer.concat([
          startlineBuf,
          crlf,
          headersBuf,
        ]));
      } else {
        onHeader(headersBuf);
      }
    }
    const bufList = [
      startlineBuf,
      crlf,
      headersBuf,
      crlf,
    ];
    if (state.contentLength > 0) {
      bufList.push(Buffer.isBuffer(body) ? body : Buffer.from(body));
    }
    const dataChunk = Buffer.concat(bufList);
    if (onEnd) {
      onEnd(state.contentLength);
    }

    return dataChunk;
  }

  return (data) => {
    if (data != null) {
      if (!Buffer.isBuffer(data) && typeof data !== 'string') {
        throw new Error('body invalid');
      }
    }
    if (state.completed) {
      throw new Error('http request encode already completed');
    }
    const chunk = data != null ? (Buffer.isBuffer(data) ? data : Buffer.from(data)) : null;

    if (!chunk || chunk.length === 0) {
      state.completed = true;
      if (state.contentSize === 0) {
        const headersBuf = generateHeadersBuf(keyValuePairList);
        if (onHeader) {
          if (!onStartLine) {
            onHeader(Buffer.concat([
              startlineBuf,
              crlf,
              headersBuf,
            ]));
          } else {
            onHeader(headersBuf);
          }
        }
        if (onEnd) {
          onEnd(0);
        }
        return Buffer.concat([
          startlineBuf,
          crlf,
          headersBuf,
          crlf,
        ]);
      }
      if (onEnd) {
        onEnd(state.contentSize);
      }
      return Buffer.from('0\r\n\r\n');
    }

    const chunkSize = chunk.length;
    const lineBuf = Buffer.from(`${chunkSize.toString(16)}\r\n`);
    if (state.contentSize === 0) {
      keyValuePairList.push('Transfer-Encoding');
      keyValuePairList.push('chunked');
      const headersBuf = generateHeadersBuf(keyValuePairList);
      if (!onHeader) {
        state.contentSize = chunkSize;
        return Buffer.concat([
          ...onStartLine ? [] : [startlineBuf, crlf],
          headersBuf,
          crlf,
          lineBuf,
          chunk,
          crlf,
        ]);
      }
      if (!onStartLine) {
        onHeader(Buffer.concat([
          startlineBuf,
          crlf,
          headersBuf,
        ]));
      } else {
        onHeader(headersBuf);
      }
    }
    state.contentSize += chunkSize;
    return Buffer.concat([
      lineBuf,
      chunk,
      crlf,
    ]);
  };
};

export default encodeHttp;
export const encodeHttpRequest = encodeHttp;
export const encodeHttpResponse = encodeHttp;
