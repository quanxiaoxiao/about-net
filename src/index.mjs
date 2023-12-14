import createConnector from './createConnector.mjs';
import pipeSocketForward from './pipeSocketForward.mjs';
import {
  decodeHttpRequest,
  decodeHttpResponse,
} from './decodeHttp.mjs';
import encodeHttp, {
  encodeHttpRequest,
  encodeHttpResponse,
} from './encodeHttp.mjs';
import createTlsConnector from './createTlsConnector.mjs';
import getCurrentDateTime from './getCurrentDateTime.mjs';
import request from './request.mjs';
import httpRequest from './httpRequest.mjs';
import httpsRequest from './httpsRequest.mjs';
import decodeContentEncoding from './decodeContentEncoding.mjs';
import filterHttpHeaders from './filterHttpHeaders.mjs';
import convertHttpHeaders from './convertHttpHeaders.mjs';
import enpack from './enpack.mjs';
import depack from './depack.mjs';
import generateID from './generateID.mjs';
import dns from './dns/index.mjs';

const getDateNow = () => Math.floor(getCurrentDateTime());

export {
  getCurrentDateTime,
  decodeHttpRequest,
  decodeHttpResponse,
  encodeHttp,
  encodeHttpRequest,
  encodeHttpResponse,
  createConnector,
  pipeSocketForward,
  createTlsConnector,
  getDateNow,
  request,
  httpRequest,
  httpsRequest,
  decodeContentEncoding,
  convertHttpHeaders,
  filterHttpHeaders,
  generateID,
  enpack,
  depack,
  dns,
};
