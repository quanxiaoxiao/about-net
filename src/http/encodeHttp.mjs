/* eslint no-nested-ternary: 0 */
import http from 'node:http';
import assert from 'node:assert';
import convertHttpHeaders from './convertHttpHeaders.mjs';
import filterHttpHeaders from './filterHttpHeaders.mjs';
import { HttpEncodeError } from '../errors.mjs';

const crlf = Buffer.from('\r\n');
const HTTP_VERSION = '1.1';
const BODY_CHUNK_END = Buffer.from('0\r\n\r\n');

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
    complete: false,
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
  const isBodyStream = options.body && (typeof options.body.pipe === 'function');

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

  if (isBodyStream) {
    keyValuePairList.push('Transfer-Encoding');
    keyValuePairList.push('chunked');
  } else if (hasBody) {
    if (body == null) {
      state.contentLength = 0;
    } else if (Buffer.isBuffer(body) || typeof body === 'string') {
      state.contentLength = Buffer.byteLength(body);
    } else {
      throw new HttpEncodeError('body invalid');
    }
    if (state.contentLength !== 0) {
      keyValuePairList.push('Content-Length');
      keyValuePairList.push(state.contentLength);
    }
  }

  if (hasBody) {
    const headersBuf = generateHeadersBuf(keyValuePairList);
    if (onHeader) {
      onHeader(Buffer.concat([
        ...onStartLine ? [] : [startlineBuf, crlf],
        headersBuf,
      ]));
    }
    if (!isBodyStream) {
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
  }

  return (data) => {
    if (data != null) {
      if (!Buffer.isBuffer(data) && typeof data !== 'string') {
        throw new HttpEncodeError('body invalid');
      }
    }
    assert(!state.complete);
    const chunk = data != null ? Buffer.from(data) : null;

    if (!chunk || chunk.length === 0) {
      state.complete = true;
      if (state.contentSize === 0) {
        const headersBuf = generateHeadersBuf(keyValuePairList);
        if (onHeader) {
          if (isBodyStream) {
            if (onEnd) {
              onEnd(0);
            }
            return Buffer.concat([
              crlf,
              BODY_CHUNK_END,
            ]);
          }
          onHeader(Buffer.concat([
            ...onStartLine ? [] : [startlineBuf, crlf],
            headersBuf,
          ]));
        }
        if (onEnd) {
          onEnd(0);
        }
        return Buffer.concat([
          startlineBuf,
          crlf,
          headersBuf,
          crlf,
          ...isBodyStream ? [BODY_CHUNK_END] : [],
        ]);
      }
      if (onEnd) {
        onEnd(state.contentSize);
      }
      return BODY_CHUNK_END;
    }

    const chunkSize = chunk.length;
    const lineBuf = Buffer.from(`${chunkSize.toString(16)}\r\n`);
    if (state.contentSize === 0) {
      if (!isBodyStream) {
        keyValuePairList.push('Transfer-Encoding');
        keyValuePairList.push('chunked');
      }
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
      if (onHeader && !isBodyStream) {
        onHeader(Buffer.concat([
          ...onStartLine ? [] : [startlineBuf, crlf],
          headersBuf,
        ]));
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
