import test from 'ava'; // eslint-disable-line
import encode from '../../src/http/encodeHttp.mjs';

test('onStartLine 1', (t) => {
  const ret = encode({
    httpVersion: '1.0',
    statusCode: 200,
    statusText: 'Connection Established',
    body: null,
  });
  t.is(ret.toString(), 'HTTP/1.0 200 Connection Established\r\n\r\n');
});
