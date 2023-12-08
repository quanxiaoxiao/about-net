import createConnector from './createConnector.mjs';
import pipeSocketForward from './pipeSocketForward.mjs';
import {
  decodeHttpRequest,
  decodeHttpResponse,
} from './decodeHttp.mjs';
import {
  encodeHttpRequest,
  encodeHttpResponse,
} from './encodeHttp.mjs';
import createTlsConnector from './createTlsConnector.mjs';
import getCurrentDateTime from './getCurrentDateTime.mjs';
import request from './request.mjs';
import httpRequest from './httpRequest.mjs';
import httpsRequest from './httpsRequest.mjs';

const getDateNow = () => Math.floor(getCurrentDateTime());

export {
  getCurrentDateTime,
  decodeHttpRequest,
  decodeHttpResponse,
  encodeHttpRequest,
  encodeHttpResponse,
  createConnector,
  pipeSocketForward,
  createTlsConnector,
  getDateNow,
  request,
  httpRequest,
  httpsRequest,
};
