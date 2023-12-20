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
    bodyBufList: [],
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
      }
    };

    state.connector = createConnector({
      onConnect: async () => {
        if (state.isActive) {
          state.dateTimeConnect = getCurrentDateTime();
          if (onRequest) {
            try {
              await onRequest(requestOptions);
            } catch (error) {
              state.connector();
              emitError(error);
            }
          }
          if (state.isActive) {
            if (requestOptions.body && requestOptions.body.pipe) {
              state.encodeRequest = encodeHttp({
                path: requestOptions.path,
                method: requestOptions.method,
                headers: requestOptions.headers,
                onHeader: (chunkRequestHeader) => {
                  state.dateTimeRequestSend = getCurrentDateTime();
                  outgoing(Buffer.concat([
                    chunkRequestHeader,
                    Buffer.from('\r\n'),
                  ]));
                },
              });
            } else {
              state.dateTimeRequestSend = getCurrentDateTime();
              outgoing(encodeHttp(requestOptions));
            }
          }
        } else {
          state.connector();
        }
      },
      onData: async (chunk) => {
        if (state.isActive) {
          if (!state.decode) {
            state.dateTimeResponse = getCurrentDateTime();
            if (onResponse) {
              await onResponse();
            }
            state.decode = decodeHttpResponse({
              onStartLine: (ret) => {
                state.statusCode = ret.statusCode;
                state.httpVersion = ret.httpVersion;
                state.statusText = ret.statusText;
              },
              onHeader: (ret) => {
                state.dateTimeHeader = getCurrentDateTime();
                state.headers = ret.headers;
                state.headersRaw = ret.headersRaw;
              },
              onBody: (bodyChunk) => {
                if (state.dateTimeBody == null) {
                  state.dateTimeBody = getCurrentDateTime();
                }
                if (bodyChunk && bodyChunk.length > 0) {
                  state.bodyBufList.push(bodyChunk);
                }
              },
              onEnd: () => {
                state.dateTimeEnd = getCurrentDateTime();
                if (state.dateTimeBody == null) {
                  state.dateTimeBody = state.dateTimeEnd;
                }
                if (state.isActive) {
                  state.isActive = false;
                  state.connector.end();
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
                    body: Buffer.concat(state.bodyBufList),
                  });
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
            emitError(error);
          }
        } else {
          state.connector();
        }
      },
      onError: emitError,
      onClose: () => emitError(new Error('socket is close')),
    }, getConnect);

    if (!state.connector) {
      emitError(new Error('create connector fail'));
    }
  });
};
