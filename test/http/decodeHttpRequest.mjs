import test from 'ava'; // eslint-disable-line
import { decodeHttpRequest } from '../../src/http/decodeHttp.mjs';

test('parseStartLine 1', (t) => {
  t.plan(3);
  const execute = decodeHttpRequest({
    onStartLine: (ret) => {
      t.is(ret.httpVersion, '1.1');
      t.is(ret.method, 'GET');
      t.is(ret.href, '/test');
    },
    onHeader: () => {
      t.fail();
    },
    onBody: () => {
      t.fail();
    },
    onEnd: () => {
      t.fail();
    },
  });

  execute(Buffer.from('GET /test HTTP/1.1\r\n'));
});

test('parseStartLine 2', (t) => {
  t.plan(4);
  const execute = decodeHttpRequest({
    onStartLine: (ret) => {
      t.is(ret.httpVersion, '1.1');
      t.is(ret.method, 'GET');
      t.is(ret.href, '/test');
    },
    onHeader: () => {
      throw new Error();
    },
    onBody: () => {
      t.fail();
    },
    onEnd: () => {
      t.fail();
    },
  });

  execute(Buffer.from('GET /test HTTP/1.1\r\n'));
  t.throws(() => {
    execute(Buffer.from('Content-Length: 3\r\n\r\n'));
  });
});
