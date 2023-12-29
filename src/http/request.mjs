/* eslint no-use-before-define: 0 */
import diagnosticsChannel from 'node:diagnostics_channel';
import createConnector from '../createConnector.mjs';
import getCurrentDateTime from '../getCurrentDateTime.mjs';
import encodeHttp from './encodeHttp.mjs';
import { decodeHttpResponse } from './decodeHttp.mjs';

const channels = {
  connect: diagnosticsChannel.channel('about-net:request:connect'),
};

/**
 * @typeof {{
 *   path: string,
 *   method: [string='GET'],
 *   body?:  Buffer | string,
  *  onChunk?:  (chunk: Buffer) => Promise<void>,
  *  onStartLine?:  (a: Object) => Promise<void>,
  *  onRequest?:  (a: Object) => Promise<void>,
  *  onHeader?:  (a: Object) => Promise<void>,
  *  onResponse?:  (a: Object) => Promise<void>,
  *  onBody?:  (a: Object) => Promise<void>,
 * }} RequestOption
 *
 */

/**
 * @param {RequestOption} options
 * @param {Function} getConnect
 */
export default (
  options,
  getConnect,
) => {
  const {
    _id,
    path,
    method = 'GET',
    body = null,
    headers,
    onChunk,
    onRequest,
    onStartLine,
    onHeader,
    onResponse,
    onBody,
  } = options;
  const state = {
    isActive: true,
    tick: null,
    dateTimeCreate: getCurrentDateTime(),
    dateTimeConnect: null,
    dateTimeRequestSend: null,
    bytesIncoming: 0,
    bytesOutgoing: 0,
    dateTimeResponse: null,
    dateTimeHeader: null,
    dateTimeBody: null,
    dateTimeEnd: null,
    body: Buffer.from([]),
    decode: null,
    statusCode: null,
    httpVersion: null,
    statusText: null,
    headers: {},
    headersRaw: [],
    encodeRequest: null,
    connector: null,
  };

  const requestOptions = {
    path,
    method,
    headers,
    body,
  };

  return new Promise((resolve, reject) => {
    const emitError = (error) => {
      if (state.isActive) {
        state.isActive = false;
        const err = typeof error === 'string' ? new Error(error) : error;
        reject(err);
      }
    };

    function handleDataOnRequestBody(chunk) {
      if (state.isActive) {
        try {
          const b = state.encodeRequest(chunk);
          if (b && b.length > 0) {
            state.bytesOutgoing += b.length;
            const ret = state.connector.write(b);
            if (!ret) {
              requestOptions.body.pause();
            }
          }
        } catch (error) {
          emitError(error);
          requestOptions.body.off('data', handleDataOnRequestBody);
          requestOptions.body.destroy();
        }
      } else {
        requestOptions.body.off('data', handleDataOnRequestBody);
        closeRequestStream();
      }
    }

    function handleErrorOnRequestBody(error) {
      emitError(error);
    }

    function handleEndOnRequestBody() {
      requestOptions.body.off('close', handleCloseOnRequestBody);
      if (state.isActive) {
        try {
          const ret = state.encodeRequest();
          if (ret && ret.length > 0) {
            state.bytesOutgoing += ret.length;
            state.connector.write(ret);
          }
        } catch (error) {
          emitError(error);
        }
      }
    }

    function handleCloseOnRequestBody() {
      requestOptions.body.off('end', handleEndOnRequestBody);
      emitError('request body stream close');
    }

    function closeRequestStream() {
      if (requestOptions.body
        && requestOptions.body.pipe
        && !requestOptions.body.destroyed
      ) {
        requestOptions.body.destroy();
      }
    }

    function bindResponseDecode() {
      state.decode = decodeHttpResponse({
        onStartLine: async (ret) => {
          state.statusCode = ret.statusCode;
          state.httpVersion = ret.httpVersion;
          state.statusText = ret.statusText;
          if (onStartLine) {
            await onStartLine({
              statusCode: state.statusCode,
              httpVersion: state.httpVersion,
              statusText: state.statusText,
            });
          }
        },
        onHeader: async (ret) => {
          state.dateTimeHeader = getCurrentDateTime();
          state.headers = ret.headers;
          state.headersRaw = ret.headersRaw;
          if (onHeader) {
            await onHeader({
              headers: state.headers,
              headersRaw: state.headersRaw,
            });
          }
          if (onResponse) {
            await onResponse({
              statusCode: state.statusCode,
              httpVersion: state.httpVersion,
              statusText: state.statusText,
              headers: state.headers,
              headersRaw: state.headersRaw,
            });
          }
        },
        onBody: async (bodyChunk) => {
          if (state.dateTimeBody == null) {
            state.dateTimeBody = getCurrentDateTime();
          }
          if (bodyChunk && bodyChunk.length > 0) {
            if (onBody) {
              await onBody(bodyChunk);
            } else {
              state.body = Buffer.concat([
                state.body,
                bodyChunk,
              ]);
            }
          }
        },
        onEnd: () => {
          state.dateTimeEnd = getCurrentDateTime();
          if (state.dateTimeBody == null) {
            state.dateTimeBody = state.dateTimeEnd;
          }
          if (state.isActive) {
            state.isActive = false;
            resolve({
              dateTimeCreate: state.dateTimeCreate,
              dateTimeConnect: state.dateTimeConnect,
              dateTimeResponse: state.dateTimeResponse,
              dateTimeHeader: state.dateTimeHeader,
              dateTimeBody: state.dateTimeBody,
              dateTimeEnd: state.dateTimeEnd,
              dateTimeRequestSend: state.dateTimeRequestSend,
              statusCode: state.statusCode,
              httpVersion: state.httpVersion,
              statusText: state.statusText,
              headers: state.headers,
              bytesIncoming: state.bytesIncoming,
              bytesOutgoing: state.bytesOutgoing,
              headersRaw: state.headersRaw,
              body: state.body,
            });
            state.connector.end();
          }
        },
      });
    }

    const socket = getConnect();

    state.connector = createConnector(
      {
        onConnect: async () => {
          channels.connect.publish({
            ..._id == null ? {} : { _id },
            remoteAddress: socket.remoteAddress,
            remotePort: socket.remotePort,
          });
          if (state.isActive) {
            clearTimeout(state.tick);
            state.dateTimeConnect = getCurrentDateTime();
            if (onRequest) {
              try {
                await onRequest(requestOptions);
              } catch (error) {
                state.connector();
                closeRequestStream();
                emitError(error);
              }
            }
            if (state.isActive) {
              if (requestOptions.body && requestOptions.body.pipe) {
                if (!requestOptions.body.readable) {
                  state.connector();
                  emitError('request body stream unable read');
                } else {
                  try {
                    state.encodeRequest = encodeHttp({
                      path: requestOptions.path,
                      method: requestOptions.method,
                      headers: requestOptions.headers,
                      onHeader: (chunkRequestHeaders) => {
                        state.dateTimeRequestSend = getCurrentDateTime();
                        const b = Buffer.concat([
                          chunkRequestHeaders,
                          Buffer.from('\r\n'),
                        ]);
                        state.bytesOutgoing += b.length;
                        state.connector.write(b);
                      },
                    });
                    requestOptions.body.once('error', handleErrorOnRequestBody);
                    requestOptions.body.once('close', handleCloseOnRequestBody);
                    requestOptions.body.once('end', handleEndOnRequestBody);
                    requestOptions.body.on('data', handleDataOnRequestBody);
                  } catch (error) {
                    state.connector();
                    emitError(error);
                    closeRequestStream();
                  }
                }
              } else {
                state.dateTimeRequestSend = getCurrentDateTime();
                try {
                  const b = encodeHttp(requestOptions);
                  if (b.length > 0) {
                    state.bytesOutgoing += b.length;
                    state.connector.write(b);
                  }
                } catch (error) {
                  emitError(error);
                  closeRequestStream();
                }
              }
            }
          } else {
            state.connector();
          }
        },
        onDrain: () => {
          if (state.isActive
            && requestOptions.body
            && requestOptions.body.pipe
            && requestOptions.body.isPaused()
          ) {
            requestOptions.body.resume();
          }
        },
        onData: async (chunk) => {
          if (state.isActive) {
            const size = chunk.length;
            state.bytesIncoming += size;
            if (!state.decode) {
              state.dateTimeResponse = getCurrentDateTime();
              bindResponseDecode();
            }
            if (size > 0 && onChunk) {
              await onChunk(chunk);
            }
            try {
              if (size > 0) {
                await state.decode(chunk);
              }
            } catch (error) {
              state.connector();
              closeRequestStream();
              emitError(error);
            }
          } else {
            state.connector();
          }
        },
        onError: (error) => {
          emitError(error);
          closeRequestStream();
        },
        onClose: () => {
          emitError('socket is close');
          closeRequestStream();
        },
      },
      () => socket,
    );

    if (!state.connector) {
      emitError('create connector fail');
      closeRequestStream();
    } else {
      state.tick = setTimeout(() => {
        if (state.isActive) {
          state.connector();
          closeRequestStream();
          emitError('connect timeout');
        }
      }, 1000 * 30);
    }
  });
};
