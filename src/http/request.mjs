/* eslint no-use-before-define: 0 */
import createConnector from '../createConnector.mjs';
import getCurrentDateTime from '../getCurrentDateTime.mjs';
import encodeHttp from './encodeHttp.mjs';
import { decodeHttpResponse } from './decodeHttp.mjs';

export default (
  {
    path,
    method = 'GET',
    body = null,
    headers,
    onChunk,
    onRequest,
    onResponse,
    onBody,
  },
  getConnect,
) => {
  const state = {
    isActive: true,
    dateTimeCreate: getCurrentDateTime(),
    dateTimeConnect: null,
    dateTimeRequestSend: null,
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
        reject(error);
      }
    };

    const outgoing = (chunk) => {
      try {
        state.connector.write(chunk);
      } catch (error) {
        emitError(error);
        closeRequestStream();
      }
    };

    function handleDataOnRequestBody(chunk) {
      if (state.isActive) {
        try {
          const b = state.encodeRequest(chunk);
          if (b && b.length > 0) {
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
            state.connector.write(ret);
          }
        } catch (error) {
          emitError(error);
        }
      }
    }

    function handleCloseOnRequestBody() {
      requestOptions.body.off('end', handleEndOnRequestBody);
      emitError(new Error('request body stream close'));
    }

    function closeRequestStream() {
      if (requestOptions.body
        && requestOptions.body.pipe
        && !requestOptions.body.destroyed
      ) {
        requestOptions.body.destroy();
      }
    }

    state.connector = createConnector(
      {
        onConnect: async () => {
          if (state.isActive) {
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
                  emitError(new Error('request body stream unable read'));
                } else {
                  try {
                    state.encodeRequest = encodeHttp({
                      path: requestOptions.path,
                      method: requestOptions.method,
                      headers: requestOptions.headers,
                    });
                    requestOptions.body.once('error', handleErrorOnRequestBody);
                    requestOptions.body.once('close', handleCloseOnRequestBody);
                    requestOptions.body.once('end', handleEndOnRequestBody);
                    requestOptions.body.on('data', handleDataOnRequestBody);
                  } catch (error) {
                    emitError(error);
                    closeRequestStream();
                  }
                }
              } else {
                state.dateTimeRequestSend = getCurrentDateTime();
                outgoing(encodeHttp(requestOptions));
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
            if (!state.decode) {
              state.dateTimeResponse = getCurrentDateTime();
              state.decode = decodeHttpResponse({
                onStartLine: (ret) => {
                  state.statusCode = ret.statusCode;
                  state.httpVersion = ret.httpVersion;
                  state.statusText = ret.statusText;
                },
                onHeader: async (ret) => {
                  state.dateTimeHeader = getCurrentDateTime();
                  state.headers = ret.headers;
                  state.headersRaw = ret.headersRaw;
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
                      await onBody(chunk);
                    }
                    state.body = Buffer.concat([
                      state.body,
                      bodyChunk,
                    ]);
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
                      headersRaw: state.headersRaw,
                      body: state.body,
                    });
                    state.connector.end();
                  }
                },
              });
            }
            if (onChunk) {
              await onChunk(chunk);
            }
            try {
              await state.decode(chunk);
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
          emitError(new Error('socket is close'));
          closeRequestStream();
        },
      },
      getConnect,
    );

    if (!state.connector) {
      emitError(new Error('create connector fail'));
      closeRequestStream();
    }
  });
};
