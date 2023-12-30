/* eslint no-use-before-define: 0 */
import diagnosticsChannel from 'node:diagnostics_channel';
import { Buffer } from 'node:buffer';
import createConnector from '../createConnector.mjs';
import getCurrentDateTime from '../getCurrentDateTime.mjs';
import encodeHttp from './encodeHttp.mjs';
import { decodeHttpResponse } from './decodeHttp.mjs';
import { HttpEncodeError } from '../errors.mjs';

const channels = {
  connect: diagnosticsChannel.channel('about-net:request:connect'),
};

/**
 * @typeof {{
  *  _id?: string,
  *  path: [string='/'],
  *  method: [string='GET'],
  *  body?:  Buffer | string,
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
    path = '/',
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
    const socket = getConnect();

    /**
     * @param {Error | string} error
     */
    const emitError = (error) => {
      if (state.isActive) {
        state.isActive = false;
        reject(typeof error === 'string' ? new Error(error) : error);
      }
    };

    /**
     * @param {Buffer} chunk
     */
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

    /**
     * @param {Error} error
     */
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

    function handleError(error) {
      emitError(error);
      closeRequestStream();
      if (state.tick != null) {
        clearTimeout(state.tick);
        state.tick = null;
      }
    }

    function pipe() {
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
        handleError(error);
      }
    }

    async function handleConnect() {
      if (onRequest) {
        try {
          await onRequest(requestOptions);
        } catch (error) {
          state.connector();
          handleError(error);
        }
      }
      if (state.isActive) {
        if (requestOptions.body && requestOptions.body.pipe) {
          if (!requestOptions.body.readable) {
            state.connector();
            emitError('request body stream unable read');
          } else {
            pipe();
          }
        } else {
          try {
            const b = encodeHttp(requestOptions);
            state.bytesOutgoing += b.length;
            state.dateTimeRequestSend = getCurrentDateTime();
            state.connector.write(b);
          } catch (error) {
            if (error instanceof HttpEncodeError) {
              state.connector();
            }
            emitError(error);
          }
        }
      }
    }

    state.connector = createConnector(
      {
        onConnect: async () => {
          const now = getCurrentDateTime();
          channels.connect.publish({
            ..._id == null ? {} : { _id },
            remoteAddress: socket.remoteAddress,
            remotePort: socket.remotePort,
            dateTimeCreate: state.dateTimeCreate,
            dateTimeConnect: now,
          });
          if (state.isActive) {
            clearTimeout(state.tick);
            state.tick = null;
            state.dateTimeConnect = now;
            await handleConnect();
          } else {
            state.connector();
          }
        },
        onData: async (chunk) => {
          if (state.isActive) {
            if (state.dateTimeRequestSend == null) {
              state.connector();
              handleError('request is not send');
            } else {
              const size = chunk.length;
              state.bytesIncoming += size;
              if (!state.decode) {
                state.dateTimeResponse = getCurrentDateTime();
                bindResponseDecode();
              }
              if (size > 0) {
                if (onChunk) {
                  try {
                    await onChunk(chunk);
                  } catch (error) {
                    state.connector();
                    handleError();
                  }
                }
                if (state.isActive) {
                  try {
                    await state.decode(chunk);
                  } catch (error) {
                    state.connector();
                    handleError(error);
                  }
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
        onError: handleError,
        onClose: () => handleError('socket is close'),
      },
      () => socket,
    );

    if (!state.connector) {
      handleError('create connector fail');
    } else if (state.isActive) {
      state.tick = setTimeout(() => {
        if (state.isActive) {
          state.connector();
          closeRequestStream();
          emitError('connect timeout');
          state.tick = null;
        }
      }, 1000 * 30);
    }
  });
};
