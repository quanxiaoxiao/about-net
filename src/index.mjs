import createConnector from './createConnector.mjs';
import pipeSocketForward from './pipeSocketForward.mjs';
import decodeHttp from './decodeHttp.mjs';
import encodeHttp from './encodeHttp.mjs';
import createTlsConnector from './createTlsConnector.mjs';

const decodeHttpRequest = (options) => decodeHttp({
  ...options,
  isRequest: true,
});

const decodeHttpResponse = (options) => decodeHttp({
  ...options,
  isRequest: false,
});

const encodeHttpRequest = (options) => encodeHttp({
  ...options,
  isResponse: false,
});

const encodeHttpResponse = (options) => encodeHttp({
  ...options,
  isResponse: true,
});

export {
  decodeHttpRequest,
  decodeHttpResponse,
  encodeHttpRequest,
  encodeHttpResponse,
  createConnector,
  pipeSocketForward,
  createTlsConnector,
};
