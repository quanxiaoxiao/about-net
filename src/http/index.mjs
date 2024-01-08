import {
  decodeHttpRequest,
  decodeHttpResponse,
} from './decodeHttp.mjs';
import encodeHttp from './encodeHttp.mjs';
import request from './request.mjs';
import httpRequest from './httpRequest.mjs';
import httpsRequest from './httpsRequest.mjs';
import filterHttpHeaders from './filterHttpHeaders.mjs';
import convertHttpHeaders from './convertHttpHeaders.mjs';
import setHeaders from './setHeaders.mjs';
import parseCookie from './parseCookie.mjs';

export default {
  encodeHttp,
  encodeHttpRequest: encodeHttp,
  encodeHttpResponse: encodeHttp,
  decodeHttpRequest,
  decodeHttpResponse,
  request,
  httpRequest,
  httpsRequest,
  filterHttpHeaders,
  convertHttpHeaders,
  setHeaders,
  parseCookie,
};
