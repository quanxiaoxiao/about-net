import test from 'ava'; // eslint-disable-line
import encodeHttpResponse from '../src/encodeHttp.mjs'; // eslint-disable-line

test('onStartLine 1', (t) => {
  const ret = encodeHttpResponse({
    httpVersion: '1.0',
    statusCode: 200,
    statusText: 'Connection Established',
    body: null,
  });
  t.is(ret.toString(), 'HTTP/1.0 200 Connection Established\r\n\r\n');
});
