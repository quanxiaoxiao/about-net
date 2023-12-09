import createConnector from './createConnector.mjs';
import encodeHttp from './encodeHttp.mjs';
import { decodeHttpResponse } from './decodeHttp.mjs';
import getCurrentDateTime from './getCurrentDateTime.mjs';

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
  };
  const requestOptions = {
    path,
    method,
    headers,
    body,
  };

  return new Promise((resolve, reject) => {
    const connector = createConnector({
      onConnect: async () => {
        if (state.isActive) {
          state.dateTimeConnect = getCurrentDateTime();
          if (onRequest) {
            try {
              await onRequest(requestOptions);
            } catch (error) {
              connector();
              if (state.isActive) {
                state.isActive = false;
                reject(error);
              }
            }
          }
          if (state.isActive) {
            try {
              state.dateTimeRequestSend = getCurrentDateTime();
              connector.write(encodeHttp(requestOptions));
            } catch (error) {
              if (state.isActive) {
                state.isActive = false;
                reject(error);
              }
            }
          }
        } else {
          connector();
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
                  connector.end();
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
            state.decode(chunk);
          } catch (error) {
            connector();
            if (state.isActive) {
              state.isActive = false;
              reject(error);
            }
          }
        } else {
          connector();
        }
      },
      onError: (error) => {
        if (state.isActive) {
          state.isActive = false;
          reject(error);
        }
      },
      onClose: () => {
        if (state.isActive) {
          state.isActive = false;
          reject(new Error('socket is close'));
        }
      },
    }, getConnect);

    if (!connector) {
      if (state.isActive) {
        state.isActive = false;
        reject(new Error('create connector fail'));
      }
    }
  });
};
