/* eslint no-nested-ternary: 0 */

const crlf = Buffer.from('\r\n');
const HTTP_VERSION = '1.1';

const generateHeadersBuf = (headers, excludes) => {
  const keys = Object.keys(headers);
  const result = [];

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = headers[key];
    if (excludes) {
      const headerKey = key.toLowerCase();
      if (excludes.includes(headerKey)) {
        continue;
      }
    }
    result.push(Buffer.concat([
      Buffer.from(`${key}: ${Array.isArray(value) ? value.join(' ;') : value}`),
      crlf,
    ]));
  }

  return Buffer.concat(result);
};

export default (options) => {
  const state = {
    completed: false,
    contentSize: 0,
  };
  const {
    headers,
    path,
    headerExcludes,
    method,
    body,
    statusCode = 200,
    statusText = 'OK',
    onStartLine,
    onHeader,
    onEnd,
    httpVersion = HTTP_VERSION,
    isResponse,
  } = options;

  const httpHeaders = {};

  if (Array.isArray(headers)) {
    for (let i = 0; i < headers.length;) {
      const key = headers[i];
      const headerKey = key.toLowerCase();
      if (headerKey !== 'content-length' && headerKey !== 'transfer-encoding') {
        const value = headers[i + 1];
        if (Object.hasOwnProperty.call(httpHeaders, key)) {
          httpHeaders[key] = Array.isArray(httpHeaders[key])
            ? [...httpHeaders[key], value]
            : [httpHeaders[key], value];
        } else {
          httpHeaders[key] = value;
        }
      }
      i += 2;
    }
  } else if (headers) {
    const headerKeys = Object
      .keys(headers);

    for (let i = 0; i < headerKeys.length; i++) {
      const key = headerKeys[i];
      const headerKey = key.toLowerCase();
      if (headerKey !== 'content-length' && headerKey !== 'transfer-encoding') {
        const value = headers[key];
        httpHeaders[key] = value;
      }
    }
  }

  if (Object.hasOwnProperty.call(options, 'body')) {
    if (body == null) {
      httpHeaders['Content-Length'] = 0;
    } else if (typeof body === 'string') {
      httpHeaders['Content-Length'] = Buffer.from(body).length;
    } else if (Buffer.isBuffer(body)) {
      httpHeaders['Content-Length'] = body.length;
    } else {
      throw new Error('body is invalid');
    }
  }

  const startLines = [];
  if (isResponse) {
    startLines.push(`HTTP/${httpVersion}`);
    startLines.push(`${statusCode}`);
    startLines.push(statusText);
  } else {
    startLines.push(method.toUpperCase());
    startLines.push(path);
    startLines.push(`HTTP/${httpVersion}`);
  }
  const startlineBuf = Buffer.from(startLines.join(' '));

  if (onStartLine) {
    onStartLine(startlineBuf);
  }

  if (Object.hasOwnProperty.call(httpHeaders, 'Content-Length')) {
    const contentLength = httpHeaders['Content-Length'];
    const headersBuf = generateHeadersBuf(httpHeaders, headerExcludes);
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
    if (body && contentLength > 0) {
      if (typeof body === 'string') {
        bufList.push(Buffer.from(body));
      } else {
        bufList.push(body);
      }
    }
    const result = Buffer.concat(bufList);
    if (onEnd) {
      onEnd(contentLength);
    }
    return result;
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
    const chunk = data != null ? (typeof data === 'string' ? Buffer.from(data) : data) : null;
    if (!chunk || chunk.length === 0) {
      state.completed = true;
      if (state.contentSize === 0) {
        httpHeaders['Content-Length'] = 0;
        const headersBuf = generateHeadersBuf(httpHeaders, headerExcludes);
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
    if (state.contentSize === 0) {
      httpHeaders['Transfer-Encoding'] = 'chunked';
      const headersBuf = generateHeadersBuf(httpHeaders, headerExcludes);
      if (!onHeader) {
        state.contentSize = chunkSize;
        return Buffer.concat([
          ...onStartLine ? [] : [startlineBuf, crlf],
          headersBuf,
          crlf,
          Buffer.from(`${chunkSize.toString(16)}`),
          crlf,
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
      Buffer.from(`${chunkSize.toString(16)}`),
      crlf,
      chunk,
      crlf,
    ]);
  };
};
