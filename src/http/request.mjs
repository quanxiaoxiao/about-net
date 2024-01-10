/* eslint no-use-before-define: 0 */
import assert from 'node:assert';
import { Buffer } from 'node:buffer';
import createConnector from '../createConnector.mjs';
import getCurrentDateTime from '../getCurrentDateTime.mjs';
import encodeHttp from './encodeHttp.mjs';
import { decodeHttpResponse } from './decodeHttp.mjs';
import {
  SocketConnectError,
  SocketCloseError,
  SocketConnectTimeoutError,
  ConnectorCreateError,
} from '../errors.mjs';

/**
 * @typedef {{
  *  _id?: string,
  *  path: [string='/'],
  *  method: [string='GET'],
  *  body?:  Buffer | string | import('node:stream').ReadableStream,
  *  onRequest?:  (a: Object) => Promise<void>,
  *  onStartLine?:  (a: Object) => Promise<void>,
  *  onHeader?:  (a: Object) => Promise<void>,
  *  onResponse?:  (a: Object) => Promise<void>,
  *  onBody?:  (a: Object) => Promise<void>,
  *  onOutgoing?: (a: Buffer) => void,
  *  onIncoming?: (a: Buffer) => void,
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
    path = '/',
    method = 'GET',
    body = null,
    headers,
    onRequest,
    onStartLine,
    onHeader,
    onResponse,
    onBody,
    onOutgoing,
    onIncoming,
    signal,
  } = options;

  if (signal) {
    assert(!signal.aborted);
  }

  return new Promise((resolve, reject) => {
    const state = {
      isActive: true,
      isConnect: false,
      tick: null,
      connector: null,
      dateTimeCreate: getCurrentDateTime(),
      bodyPending: false,
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
    };

    const requestOptions = {
      path,
      method,
      headers,
      body,
    };

    const socket = getConnect();

    /**
     * @param {Error | string} error
     */
    function emitError(error) {
      if (state.isActive) {
        state.isActive = false;
        if (state.connector && signal) {
          signal.removeEventListener('abort', handleAbortOnSignal);
        }
        const errObj = typeof error === 'string' ? new Error(error) : error;
        reject(errObj);
      }
    }

    /**
     * @param {Buffer} [chunk]
     */
    function outgoing(chunk) {
      assert(state.isActive);
      const size = chunk ? chunk.length : 0;
      if (size > 0) {
        try {
          state.bytesOutgoing += size;
          if (onOutgoing) {
            onOutgoing(chunk);
          }
          const ret = state.connector.write(chunk);
          if (!ret
              && requestOptions.body
              && requestOptions.body.pipe
              && !requestOptions.body.isPaused()
          ) {
            requestOptions.body.pause();
          }
        } catch (error) {
          handleError(error);
          state.connector();
        }
      }
    }

    async function handleConnect() {
      if (!state.isActive) {
        state.connector();
      } else if (onRequest) {
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
            state.dateTimeRequestSend = getCurrentDateTime();
            outgoing(encodeHttp(requestOptions));
          } catch (error) {
            state.connector();
            emitError(error);
          }
        }
      }
    }

    /**
     * @param {Buffer} chunk
     */
    function handleDataOnRequestBody(chunk) {
      if (state.isActive) {
        try {
          outgoing(state.encodeRequest(chunk));
        } catch (error) {
          state.connector();
          handleError(error);
        }
      } else {
        requestOptions.body.off('data', handleDataOnRequestBody);
        closeRequestStream();
      }
    }

    function handleEndOnRequestBody() {
      requestOptions.body.off('close', handleCloseOnRequestBody);
      requestOptions.body.off('error', handleErrorOnRequestBody);
      if (state.isActive) {
        try {
          outgoing(state.encodeRequest());
        } catch (error) {
          state.connector();
          emitError(error);
        }
      }
    }

    function handleCloseOnRequestBody() {
      requestOptions.body.off('end', handleEndOnRequestBody);
      emitError('request body stream close');
      state.connector();
    }

    function handleErrorOnRequestBody(error) {
      emitError(error);
      state.connector();
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
      state.dateTimeResponse = getCurrentDateTime();
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
          assert(state.isActive);
          state.dateTimeHeader = getCurrentDateTime();
          state.headers = ret.headers;
          state.headersRaw = ret.headersRaw;
          if (onHeader) {
            await onHeader({
              headers: state.headers,
              headersRaw: state.headersRaw,
            });
          }
          assert(state.isActive);
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
          assert(state.isActive);
          if (state.dateTimeBody == null) {
            state.dateTimeBody = getCurrentDateTime();
          }
          if (bodyChunk && bodyChunk.length > 0) {
            if (onBody) {
              state.bodyPending = true;
              await onBody(bodyChunk);
              state.bodyPending = false;
              state.connector.resume();
            } else {
              state.body = Buffer.concat([
                state.body,
                bodyChunk,
              ]);
            }
          }
        },
        onEnd: () => {
          assert(state.isActive);
          state.isActive = false;
          state.dateTimeEnd = getCurrentDateTime();
          if (state.dateTimeBody == null) {
            state.dateTimeBody = state.dateTimeEnd;
          }
          if (signal) {
            signal.removeEventListener('abort', handleAbortOnSignal);
          }
          resolve({
            dateTimeCreate: state.dateTimeCreate,
            dateTimeConnect: state.dateTimeConnect,
            dateTimeResponse: state.dateTimeResponse,
            dateTimeHeader: state.dateTimeHeader,
            dateTimeBody: state.dateTimeBody,
            dateTimeEnd: state.dateTimeEnd,
            dateTimeRequestSend: state.dateTimeRequestSend,
            bytesIncoming: state.bytesIncoming,
            bytesOutgoing: state.bytesOutgoing,
            httpVersion: state.httpVersion,
            statusCode: state.statusCode,
            statusText: state.statusText,
            headersRaw: state.headersRaw,
            headers: state.headers,
            body: state.body,
          });
          state.connector.end();
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
          body: requestOptions.body,
          onHeader: (chunkRequestHeaders) => {
            state.dateTimeRequestSend = getCurrentDateTime();
            outgoing(Buffer.concat([
              chunkRequestHeaders,
              Buffer.from('\r\n'),
            ]));
            if (state.isActive) {
              requestOptions.body.once('error', handleErrorOnRequestBody);
              requestOptions.body.once('close', handleCloseOnRequestBody);
              requestOptions.body.once('end', handleEndOnRequestBody);
              requestOptions.body.on('data', handleDataOnRequestBody);
              if (requestOptions.body.isPaused()) {
                requestOptions.body.resume();
              }
            }
          },
        });
      } catch (error) {
        state.connector();
        handleError(error);
      }
    }

    function handleAbortOnSignal() {
      if (state.isActive) {
        state.isActive = false;
        state.connector();
        closeRequestStream();
        if (state.tick) {
          clearTimeout(state.tick);
          state.tick = null;
        }
        reject(new Error('abort'));
      }
    }

    state.connector = createConnector(
      {
        onConnect: async () => {
          if (state.isActive) {
            state.isConnect = true;
            const now = getCurrentDateTime();
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
            if (state.bodyPending) {
              state.connector.pause();
            }
            if (state.dateTimeRequestSend == null) {
              state.connector();
              handleError(new Error('request is not send'));
            } else {
              const size = chunk.length;
              state.bytesIncoming += size;
              if (!state.decode) {
                bindResponseDecode();
              }
              if (size > 0) {
                try {
                  if (onIncoming) {
                    onIncoming(chunk);
                  }
                  await state.decode(chunk);
                } catch (error) {
                  state.connector();
                  handleError(error);
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
        onError: (error) => {
          if (state.isConnect) {
            handleError(error);
          } else {
            handleError(new SocketConnectError());
          }
        },
        onClose: () => {
          handleError(new SocketCloseError());
        },
      },
      () => socket,
    );

    if (!state.connector) {
      handleError(new ConnectorCreateError());
    } else if (state.isActive) {
      state.tick = setTimeout(() => {
        state.tick = null;
        if (state.isActive) {
          state.connector();
          closeRequestStream();
          emitError(new SocketConnectTimeoutError());
        }
      }, 1000 * 30);
      if (signal) {
        signal.addEventListener(
          'abort',
          handleAbortOnSignal,
          { once: true },
        );
      }
    }
  });
};
