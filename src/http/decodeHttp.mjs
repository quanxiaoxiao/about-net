/* eslint prefer-destructuring: 0 */
import readHttpLine from './readHttpLine.mjs';
import filterHttpHeaders from './filterHttpHeaders.mjs';

const crlf = Buffer.from([0x0d, 0x0a]);
const MAX_CHUNK_SIZE = 1024 * 1024 * 800;
const MAX_CHUNK_LENGTH = MAX_CHUNK_SIZE.toString(16).length;
const COLON_CHAR_CODE = 0x3a;

const REQUEST_STARTLINE_REG = /^([^ ]+) +([^ ]+) +HTTP\/(1\.1|1\.0|2)$/;
const RESPONSE_STARTLINE_REG = /^HTTP\/(1\.1|1\.0|2)\s+(\d+)(.*)/;

const decodeHttp = (
  {
    onStartLine,
    onHeader,
    onBody,
    onEnd,
    isRequest,
  } = {},
) => {
  const state = {
    step: 0,
    httpVersion: null,
    statusText: null,
    statusCode: null,
    method: null,
    href: null,
    headers: {},
    headersRaw: [],
    size: 0,
    chunkSize: 0,
    dataBuf: Buffer.from([]),
    bodyBuf: Buffer.from([]),
  };

  const isHeaderPraseComplete = () => state.step >= 2;
  const isBodyParseComplete = () => state.step >= 3;

  const parseStartLine = async () => {
    const chunk = readHttpLine(
      state.dataBuf,
      0,
      'start line',
    );
    if (!chunk) {
      return;
    }
    const len = chunk.length;
    const matches = chunk.toString().match(isRequest ? REQUEST_STARTLINE_REG : RESPONSE_STARTLINE_REG);
    if (!matches) {
      throw new Error('parse start line fail');
    }
    if (isRequest) {
      state.method = matches[1].toUpperCase();
      state.href = matches[2];
      state.httpVersion = matches[3];
    } else {
      if (matches[3]) {
        if (matches[3][0] !== ' ') {
          throw new Error('parse start line fail');
        }
        const statusText = matches[3].trim();
        if (statusText !== '') {
          state.statusText = statusText;
        }
      }
      state.httpVersion = matches[1];
      state.statusCode = parseInt(matches[2], 10);
    }
    state.dataBuf = state.dataBuf.slice(len + 2);
    state.size -= (len + 2);
    state.step += 1;
    if (onStartLine) {
      if (isRequest) {
        await onStartLine({
          href: state.href,
          method: state.method,
          httpVersion: state.httpVersion,
        });
      } else {
        await onStartLine({
          httpVersion: state.httpVersion,
          statusCode: state.statusCode,
          statusText: state.statusText,
        });
      }
    }
  };

  const parseHeaders = async () => {
    while (!isHeaderPraseComplete()
      && state.size >= 2) {
      const chunk = readHttpLine(
        state.dataBuf,
        0,
        'header',
      );
      if (!chunk) {
        return;
      }
      const len = chunk.length;
      state.dataBuf = state.dataBuf.slice(len + 2);
      state.size -= (len + 2);
      if (len === 0) {
        state.step += 1;
      } else {
        const indexSplit = chunk.findIndex((b) => b === COLON_CHAR_CODE);
        if (indexSplit === -1) {
          throw new Error(`parse headers fail, \`${chunk.toString()}\` invalid`);
        }
        const headerKey = chunk.slice(0, indexSplit).toString().trim();
        const value = chunk.slice(indexSplit + 1).toString().trim();
        if (headerKey !== '' && value !== '') {
          state.headersRaw.push(headerKey);
          state.headersRaw.push(value);
          const headerName = headerKey.toLowerCase();
          if (state.headers[headerName] != null) {
            state.headers[headerName] = Array.isArray(state.headers[headerName])
              ? [...state.headers[headerName], value]
              : [state.headers[headerName], value];
          } else if (headerName === 'content-length') {
            const contentLength = parseInt(value, 10);
            if (Number.isNaN(contentLength)
                || `${contentLength}` !== chunk.slice(indexSplit + 1).toString().trim()
                || contentLength < 0
            ) {
              throw new Error('parse headers fail, content-length invalid');
            }
            state.headers[headerName] = contentLength;
          } else {
            state.headers[headerName] = value;
          }
        }
      }
    }
    if (isHeaderPraseComplete()) {
      if (!Object.hasOwnProperty.call(state.headers, 'content-length')
        && (state.headers['transfer-encoding'] || '').toLowerCase() !== 'chunked') {
        state.headers['content-length'] = 0;
      }
      if ((state.headers['transfer-encoding'] || '').toLowerCase() === 'chunked') {
        state.chunkSize = -1;
        if (Object.hasOwnProperty.call(state.headers, 'content-length')) {
          delete state.headers['content-length'];
          state.headersRaw = filterHttpHeaders(state.headersRaw, ['content-length']);
        }
      }
      if (onHeader) {
        await onHeader({
          headers: state.headers,
          headersRaw: state.headersRaw,
        });
      }
    }
  };

  const parseBodyWithContentLength = async () => {
    const contentLength = state.headers['content-length'];
    if (contentLength > 0) {
      if (state.chunkSize + state.dataBuf.length < contentLength) {
        state.chunkSize += state.dataBuf.length;
        state.bodyBuf = Buffer.concat([
          state.bodyBuf,
          state.dataBuf,
        ]);
        state.dataBuf = Buffer.from([]);
        state.size = 0;
        if (onBody && state.bodyBuf.length > 0) {
          const bodyChunk = state.bodyBuf;
          state.bodyBuf = Buffer.from([]);
          await onBody(bodyChunk);
        }
      } else {
        state.bodyBuf = Buffer.concat([
          state.bodyBuf,
          state.dataBuf.slice(0, contentLength - state.chunkSize),
        ]);
        state.dataBuf = state.dataBuf.slice(contentLength - state.chunkSize);
        state.size = state.dataBuf.length;
        state.chunkSize = contentLength;
        state.step += 1;
        if (onBody && state.bodyBuf.length > 0) {
          const bodyChunk = state.bodyBuf;
          state.bodyBuf = Buffer.from([]);
          await onBody(bodyChunk);
        }
      }
    } else {
      state.step += 1;
    }
  };

  const parseBodyWithChunk = async () => {
    if (isBodyParseComplete()) {
      throw new Error('body already parse complete');
    }
    if (state.chunkSize !== -1) {
      if (state.chunkSize + 2 <= state.dataBuf.length) {
        if (state.dataBuf[state.chunkSize] !== crlf[0]
              || state.dataBuf[state.chunkSize + 1] !== crlf[1]) {
          throw new Error('parse body fail');
        }
        if (state.chunkSize === 0) {
          state.step += 1;
          state.chunkSize = -1;
          state.dataBuf = state.dataBuf.slice(2);
          state.size = state.dataBuf.length;
        } else {
          const chunk = state.dataBuf.slice(0, state.chunkSize);
          state.bodyBuf = Buffer.concat([
            state.bodyBuf,
            chunk,
          ]);
          state.dataBuf = state.dataBuf.slice(state.chunkSize + 2);
          state.size = state.dataBuf.length;
          state.chunkSize = -1;
          if (onBody && state.bodyBuf.length > 0) {
            const bodyChunk = state.bodyBuf;
            state.bodyBuf = Buffer.from([]);
            await onBody(bodyChunk);
          }
          await parseBodyWithChunk();
        }
      }
    } else {
      const chunk = state.dataBuf.slice(0, Math.min(MAX_CHUNK_LENGTH, state.size));
      const index = chunk.findIndex((b) => b === crlf[1]);
      if (index !== -1) {
        if (index <= 1 || chunk[index - 1] !== crlf[0]) {
          throw new Error('parse body fail');
        }
        const hexChunkSize = chunk.slice(0, index - 1).toString();
        const chunkSize = parseInt(hexChunkSize, 16);
        if (Number.isNaN(chunkSize)
              || chunkSize.toString(16) !== hexChunkSize
              || chunkSize < 0
              || chunkSize > MAX_CHUNK_SIZE
        ) {
          throw new Error('parse body fail');
        }
        state.dataBuf = state.dataBuf.slice(index + 1);
        state.size = state.dataBuf.length;
        state.chunkSize = chunkSize;
        await parseBodyWithChunk();
      } else if (chunk.length === MAX_CHUNK_LENGTH) {
        throw new Error('parse body fail');
      }
    }
  };

  const parseBody = async () => {
    if (isBodyParseComplete()) {
      throw new Error('body already parse complete');
    }
    if ((state.headers['transfer-encoding'] || '').toLowerCase() === 'chunked') {
      await parseBodyWithChunk();
    } else {
      await parseBodyWithContentLength();
    }
  };

  const getState = () => ({
    ...isRequest ? {
      method: state.method,
      href: state.href,
    } : {
      statusCode: state.statusCode,
      statusText: state.statusText,
    },
    httpVersion: state.httpVersion,
    headers: state.headers,
    headersRaw: state.headersRaw,
    body: state.bodyBuf,
    dataBuf: state.dataBuf,
    complete: isBodyParseComplete(),
  });

  const processes = [
    parseStartLine,
    parseHeaders,
    parseBody,
  ];

  return async (chunk) => {
    if (isBodyParseComplete()) {
      throw new Error('already complete');
    }

    if (chunk && chunk.length > 0) {
      state.size += chunk.length;
      state.dataBuf = Buffer.concat([
        state.dataBuf,
        chunk,
      ], state.size);
    }

    while (state.step < processes.length) {
      const fn = processes[state.step];
      const current = state.step;
      await fn(); // eslint-disable-line
      if (current === state.step) {
        return getState();
      }
    }

    if (isBodyParseComplete() && onEnd) {
      await onEnd(getState());
    }

    return getState();
  };
};

export const decodeHttpRequest = (options) => decodeHttp({
  ...options,
  isRequest: true,
});

export const decodeHttpResponse = (options) => decodeHttp({
  ...options,
  isRequest: false,
});
