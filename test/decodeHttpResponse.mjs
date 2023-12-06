import test from 'ava'; // eslint-disable-line
import { decodeHttpResponse } from '../src/index.mjs';

test('parseStartLine fail 1', (t) => {
  t.plan(1);
  const execute = decodeHttpResponse({
    onStartLine: () => {
      t.fail();
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

  execute(Buffer.from('HTTP/1.1 200'));
  t.throws(() => {
    execute(Buffer.from('\n'));
  });
});

test('parseStartLine fail 2', (t) => {
  t.plan(1);
  const execute = decodeHttpResponse({
    onStartLine: () => {
      t.fail();
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

  t.throws(() => {
    execute(Buffer.from('HTTP/1.1 200s\r\n'));
  });
});

test('parseStartLine fail 3', (t) => {
  t.plan(1);
  const execute = decodeHttpResponse({
    onStartLine: () => {
      t.fail();
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

  t.throws(() => {
    execute(Buffer.from('HTTP/1.1200\r\n'));
  });
});

test('parseStartLine', (t) => {
  t.plan(3);
  const execute = decodeHttpResponse({
    onStartLine: (state) => {
      t.is(state.httpVersion, '1.1');
      t.is(state.statusCode, 200);
      t.is(state.statusText, null);
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
  execute(Buffer.from('HTTP/1.1 200\r'));
  execute(Buffer.from('\n'));
});

test('parseHeaders fail 1', (t) => {
  t.plan(5);
  const execute = decodeHttpResponse({
    onStartLine: () => {
      t.pass();
    },
    onHeader: (ret) => {
      t.is(ret.headers['content-length'], 0);
      t.is(ret.headersRaw.length, 0);
    },
    onBody: () => {
      t.fail();
    },
    onEnd: () => {
      t.pass();
    },
  });

  execute(Buffer.from('HTTP/1.1 200\r\n'));
  const ret = execute(Buffer.from('\r\n'));
  t.is(ret.headers['content-length'], 0);
});

test('parseHeaders fail 2', (t) => {
  t.plan(2);
  const execute = decodeHttpResponse({
    onStartLine: () => {
      t.pass();
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

  execute(Buffer.from('HTTP/1.1 200\r\n'));
  t.throws(() => {
    execute(Buffer.from('content-length: -1\r\n'));
  });
});

test('parseHeaders fail 3', (t) => {
  t.plan(2);
  const execute = decodeHttpResponse({
    onStartLine: () => {
      t.pass();
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

  execute(Buffer.from('HTTP/1.1 200\r\n'));
  t.throws(() => {
    execute(Buffer.from('content-length: 10.\r\n'));
  });
});

test('parseHeaders fail 4', (t) => {
  t.plan(2);
  const execute = decodeHttpResponse({
    onStartLine: () => {
      t.pass();
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

  execute(Buffer.from('HTTP/1.1 200\r\n'));
  t.throws(() => {
    execute(Buffer.from('content-length: 10.4\r\n'));
  });
});

test('parseHeaders fail 5', (t) => {
  t.plan(4);
  const execute = decodeHttpResponse({
    onStartLine: () => {
      t.pass();
    },
    onHeader: () => {
      t.pass();
    },
    onBody: () => {
      t.fail();
    },
    onEnd: () => {
      t.pass();
    },
  });

  execute(Buffer.from('HTTP/1.1 200\r\n'));
  execute(Buffer.from('\r\n'));
  t.throws(() => {
    execute(Buffer.from('2'));
  });
});

test('parseHeaders fail 6', (t) => {
  t.plan(5);
  const execute = decodeHttpResponse({
    onStartLine: () => {
      t.pass();
    },
    onHeader: (ret) => {
      t.is(ret.headersRaw.length, 2);
    },
    onBody: () => {
      t.fail();
    },
    onEnd: (ret) => {
      t.is(ret.headers['content-length'], 0);
    },
  });

  execute(Buffer.from('HTTP/1.1 200\r\n'));
  execute(Buffer.from('Server: quan\r\n'));
  const ret = execute(Buffer.from('\r\n'));
  t.is(ret.headers['content-length'], 0);
  t.throws(() => {
    execute(Buffer.from('1'));
  });
});

test('parseHeaders fail 7', (t) => {
  t.plan(2);
  const execute = decodeHttpResponse({
    onStartLine: () => {
      t.pass();
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

  execute(Buffer.from('HTTP/1.1 200\r\n'));
  execute(Buffer.from('Server: quan'));
  t.throws(() => {
    execute(Buffer.from('\n'));
  });
});

test('parseHeaders fail 8', (t) => {
  t.plan(5);
  const execute = decodeHttpResponse({
    onStartLine: () => {
      t.pass();
    },
    onHeader: () => {
      t.pass();
    },
    onBody: () => {
      t.fail();
    },
    onEnd: () => {
      t.pass();
    },
  });

  execute(Buffer.from('HTTP/1.1 200\r\n'));
  const ret = execute(Buffer.from('\r\n'));
  t.true(ret.complete);
  t.throws(() => {
    execute(Buffer.from('1'));
  });
});

test('parseHeaders 1', (t) => {
  t.plan(4);
  const execute = decodeHttpResponse({
    onStartLine: () => {
      t.pass();
    },
    onHeader: (state) => {
      t.deepEqual(state.headers, {
        server: 'Quan',
        auth: 'aaa',
        'content-length': 3,
      });
    },
    onBody: () => {
      t.fail();
    },
    onEnd: () => {
      t.fail();
    },
  });

  let ret = execute(Buffer.from('HTTP/1.1 200\r\n'));
  t.is(ret.statusCode, 200);
  execute(Buffer.from('Content-Length: 3\r\n'));
  execute(Buffer.from('Server: Quan\r\n'));
  execute(Buffer.from('Auth: aaa\r\n'));
  ret = execute(Buffer.from('\r\n'));
  t.deepEqual(ret.headers, {
    server: 'Quan',
    auth: 'aaa',
    'content-length': 3,
  });
});

test('parseHeaders 2', (t) => {
  t.plan(1);
  const execute = decodeHttpResponse({
    onHeader: (state) => {
      t.deepEqual(state.headers, {
        'content-length': 3,
        'set-cookie': [
          'aaa=111; path=/; httponly',
          'bbb=222; path=/; httponly',
          'ccc=333; path=/; httponly',
        ],
      });
    },
    onBody: () => {
      t.fail();
    },
    onEnd: () => {
      t.fail();
    },
  });

  execute(Buffer.from('HTTP/1.1 200\r\n'));
  execute(Buffer.from('Content-Length: 3\r\n'));
  execute(Buffer.from('set-cookie: aaa=111; path=/; httponly\r\n'));
  execute(Buffer.from('Set-Cookie: bbb=222; path=/; httponly\r\n'));
  execute(Buffer.from('set-Cookie: ccc=333; path=/; httponly\r\n'));
  execute(Buffer.from('\r\n'));
});

test('parseHeaders 3', (t) => {
  t.plan(1);
  const execute = decodeHttpResponse({
    onHeader: (state) => {
      t.deepEqual(state.headers, {
        'content-length': 3,
      });
    },
    onBody: () => {
      t.fail();
    },
    onEnd: () => {
      t.fail();
    },
  });

  execute(Buffer.from('HTTP/1.1 200\r\n'));
  execute(Buffer.from('Content-Length: 3'));
  execute(Buffer.from('\r\n'));
  execute(Buffer.from('\r'));
  execute(Buffer.from('\n'));
});

test('parseHeaders 4', (t) => {
  t.plan(1);
  const execute = decodeHttpResponse({
    onHeader: (state) => {
      t.deepEqual(state.headers, {
        'content-length': 3,
        auth: ['111', '222'],
      });
    },
    onBody: () => {
      t.fail();
    },
    onEnd: () => {
      t.fail();
    },
  });

  execute(Buffer.from('HTTP/1.1 200\r\n'));
  execute(Buffer.from('Content-Length: 3\r\n'));
  execute(Buffer.from('auth: 111\r\n'));
  execute(Buffer.from('Auth: 222\r\n'));
  execute(Buffer.from('\r\n'));
});

test('parseHeaders 5', (t) => {
  t.plan(1);
  const execute = decodeHttpResponse({
    onHeader: (state) => {
      t.deepEqual(state.headers, {
        'content-length': 3,
        'set-cookie': 'aaa=111; path=/; httponly',
      });
    },
    onBody: () => {
      t.fail();
    },
    onEnd: () => {
      t.fail();
    },
  });

  execute(Buffer.from('HTTP/1.1 200\r\n'));
  execute(Buffer.from('Content-Length: 3\r\n'));
  execute(Buffer.from('set-cookie: aaa=111; path=/; httponly\r\n'));
  execute(Buffer.from('\r\n'));
});

test('parseBody fail 1', (t) => {
  t.plan(7);
  let i = 0;
  const execute = decodeHttpResponse({
    onStartLine: () => {
      t.pass();
    },
    onHeader: () => {
      t.pass();
    },
    onBody: (chunk) => {
      if (i === 0) {
        t.is(chunk.toString(), 'ab');
      } else if (i === 1) {
        t.is(chunk.toString(), 'c');
      } else {
        t.fail();
      }
      i++;
    },
    onEnd: () => {
      t.pass();
    },
  });

  execute(Buffer.from('HTTP/1.1 200\r\n'));
  execute(Buffer.from('Content-Length: 3\r\n'));
  execute(Buffer.from('\r\n'));
  execute(Buffer.from('ab'));
  const ret = execute(Buffer.from('cd'));
  t.is(ret.dataBuf.toString(), 'd');
  t.throws(() => {
    execute(Buffer.from('e'));
  });
});

test('parseBody fail 2', (t) => {
  t.plan(5);
  let i = 0;
  const execute = decodeHttpResponse({
    onBody: (chunk) => {
      if (i === 0) {
        t.is(chunk.toString(), 'ab');
      } else if (i === 1) {
        t.is(chunk.toString(), 'c');
      } else {
        t.fail();
      }
      i++;
    },
    onEnd: () => {
      t.pass();
    },
  });

  execute(Buffer.from('HTTP/1.1 200\r\n'));
  execute(Buffer.from('Content-Length: 3\r\n'));
  execute(Buffer.from('\r\n'));
  execute(Buffer.from('ab'));
  const ret = execute(Buffer.from('c'));
  t.is(ret.body.toString(), '');
  t.throws(() => {
    execute(Buffer.from('d'));
  });
});

test('parseBody fail 3', (t) => {
  t.plan(1);
  const execute = decodeHttpResponse({
    onBody: () => {
      t.fail();
    },
    onEnd: () => {
      t.fail();
    },
  });

  execute(Buffer.from('HTTP/1.1 200\r\n'));
  execute(Buffer.from('transfer-encoding: chunked\r\n'));
  execute(Buffer.from('\r\n'));
  t.throws(() => {
    execute(Buffer.from('1s\r\n'));
  });
});

test('parseBody fail 4', (t) => {
  t.plan(1);
  const execute = decodeHttpResponse({
    onBody: () => {
      t.fail();
    },
    onEnd: () => {
      t.fail();
    },
  });

  execute(Buffer.from('HTTP/1.1 200\r\n'));
  execute(Buffer.from('transfer-encoding: chunked\r\n'));
  execute(Buffer.from('\r\n'));
  execute(Buffer.from('3\r\n'));
  t.throws(() => {
    execute(Buffer.from('abcde'));
  });
});

test('parseBody fail 5', (t) => {
  t.plan(4);
  const execute = decodeHttpResponse({
    onBody: (chunk) => {
      t.is(chunk.toString(), 'abc');
    },
    onEnd: () => {
      t.pass();
    },
  });

  execute(Buffer.from('HTTP/1.1 200\r\n'));
  execute(Buffer.from('transfer-encoding: chunked\r\n'));
  execute(Buffer.from('\r\n'));
  execute(Buffer.from('3\r\n'));
  execute(Buffer.from('abc\r\n'));
  execute(Buffer.from('0\r\n'));
  const ret = execute(Buffer.from('\r\naaa'));
  t.is(ret.dataBuf.toString(), 'aaa');
  t.throws(() => {
    execute(Buffer.from('b'));
  });
});

test('parseBody fail 6', (t) => {
  t.plan(4);
  const execute = decodeHttpResponse({
    onStartLine: () => {
      t.pass();
    },
    onHeader: () => {
      t.pass();
    },
    onBody: (chunk) => {
      t.is(chunk.toString(), 'abc');
    },
    onEnd: () => {
      t.fail();
    },
  });

  execute(Buffer.from('HTTP/1.1 200\r\n'));
  execute(Buffer.from('transfer-encoding: chunked\r\n'));
  execute(Buffer.from('\r\n'));
  execute(Buffer.from('3\r\n'));
  execute(Buffer.from('abc\r\n'));
  t.throws(() => {
    execute(Buffer.from('12s\r\n'));
  });
});

test('parseBody fail 7', (t) => {
  t.plan(3);
  const execute = decodeHttpResponse({
    onStartLine: () => {
      t.pass();
    },
    onHeader: () => {
      t.pass();
    },
    onBody: () => {
      t.fail();
    },
    onEnd: () => {
      t.fail();
    },
  });

  execute(Buffer.from('HTTP/1.1 200\r\n'));
  execute(Buffer.from('transfer-encoding: chunked\r\n'));
  execute(Buffer.from('\r\n'));
  execute(Buffer.from('3'));
  execute(Buffer.from('abc'));
  t.throws(() => {
    execute(Buffer.from('12345678'));
  });
});

test('parseBody 1', (t) => {
  t.plan(5);
  const execute = decodeHttpResponse({
    onStartLine: () => {
      t.pass();
    },
    onHeader: () => {
      t.pass();
    },
    onBody: (chunk) => {
      t.is(chunk.toString(), 'abc');
    },
    onEnd: () => {
      t.pass();
    },
  });

  execute(Buffer.from('HTTP/1.1 200\r\n'));
  execute(Buffer.from('transfer-encoding: chunked\r\n'));
  execute(Buffer.from('\r\n'));
  execute(Buffer.from('3\r\n'));
  execute(Buffer.from('abc\r\n'));
  execute(Buffer.from('0\r\n'));
  const ret = execute(Buffer.from('\r\n'));
  t.is(ret.body.toString(), '');
});

test('parseBody 2', (t) => {
  t.plan(6);
  let i = 0;
  const execute = decodeHttpResponse({
    onStartLine: () => {
      t.pass();
    },
    onHeader: () => {
      t.pass();
    },
    onBody: (chunk) => {
      if (i === 0) {
        t.is(chunk.toString(), 'abc');
      } else if (i === 1) {
        t.is(chunk.toString(), 'z');
      } else {
        t.fail();
      }
      i++;
    },
    onEnd: () => {
      t.pass();
    },
  });

  execute(Buffer.from('HTTP/1.1 200\r\n'));
  execute(Buffer.from('transfer-encoding: chunked\r\n'));
  execute(Buffer.from('\r\n'));
  execute(Buffer.from('3\r\n'));
  execute(Buffer.from('abc\r'));
  execute(Buffer.from('\n'));
  execute(Buffer.from('1\r\n'));
  execute(Buffer.from('z'));
  execute(Buffer.from('\r\n'));
  execute(Buffer.from('0\r\n'));
  execute(Buffer.from('\r\n'));
  t.throws(() => {
    execute(Buffer.from('11\r\n'));
  });
});

test('parseBody 3', (t) => {
  t.plan(5);
  const execute = decodeHttpResponse({
    onStartLine: () => {
      t.pass();
    },
    onHeader: () => {
      t.pass();
    },
    onEnd: () => {
      t.pass();
    },
  });

  const ret = execute(Buffer.from('HTTP/1.1 200\r\ncontent-length: 4\r\n\r\nabcd'));

  t.is(ret.body.toString(), 'abcd');
  t.throws(() => {
    execute(Buffer.from('bbb'));
  });
});

test('parseBody 4', (t) => {
  const execute = decodeHttpResponse();

  let ret = execute(Buffer.from('HTTP/1.1 200\r\ncontent-length: 8\r\n\r\nabcd'));
  t.is(ret.body.toString(), 'abcd');
  t.false(ret.complete);
  ret = execute(Buffer.from('efgg'));
  t.true(ret.complete);
  t.is(ret.body.toString(), 'abcdefgg');
  t.throws(() => {
    execute('aaa');
  });
});

test('parseBody 5', (t) => {
  const execute = decodeHttpResponse();

  let ret = execute(Buffer.from('HTTP/1.1 200\r\ntransfer-encoding: chunked\r\n\r\n8\r\nabcd'));
  t.is(ret.body.toString(), '');
  t.false(ret.complete);
  ret = execute(Buffer.from('efgg\r\n'));
  t.false(ret.complete);
  t.is(ret.body.toString(), 'abcdefgg');
  execute(Buffer.from('2\r\n'));
  ret = execute(Buffer.from('d'));
  t.is(ret.body.toString(), 'abcdefgg');
  ret = execute(Buffer.from('d\r\n'));
  t.false(ret.complete);
  t.is(ret.body.toString(), 'abcdefggdd');
  ret = execute(Buffer.from('0\r'));
  t.false(ret.complete);
  ret = execute(Buffer.from('\n'));
  t.false(ret.complete);
  ret = execute(Buffer.from('\r\n'));
  t.true(ret.complete);
});

test('parseBody 6', (t) => {
  t.plan(3);
  const execute = decodeHttpResponse({
    onStartLine: () => {
      t.pass();
    },
    onHeader: () => {
      t.pass();
    },
    onBody: () => {
      throw new Error();
    },
    onEnd: () => {
      t.fail();
    },
  });

  execute(Buffer.from('HTTP/1.1 200\r\n'));
  execute(Buffer.from('transfer-encoding: chunked\r\n'));
  execute(Buffer.from('\r\n'));
  execute(Buffer.from('3\r\n'));
  execute(Buffer.from('abc\r'));
  t.throws(() => {
    execute(Buffer.from('\n'));
  });
});

test('parseBody 7', (t) => {
  t.plan(5);
  const execute = decodeHttpResponse({
    onStartLine: () => {
      t.pass();
    },
    onHeader: () => {
      t.pass();
    },
    onBody: () => {
      t.fail();
    },
    onEnd: () => {
      t.pass();
    },
  });

  execute(Buffer.from('HTTP/1.1 200\r\n'));
  const ret = execute(Buffer.from('Content-Length: 0\r\n\r\naaabbb'));
  t.is(ret.dataBuf.toString(), 'aaabbb');
  t.throws(() => {
    execute(Buffer.from('ccc'));
  });
});

test('parseBody 8', (t) => {
  t.plan(5);
  const execute = decodeHttpResponse({
    onStartLine: () => {
      t.pass();
    },
    onHeader: () => {
      t.pass();
    },
    onBody: () => {
      t.fail();
    },
    onEnd: () => {
      t.pass();
    },
  });

  execute(Buffer.from('HTTP/1.1 200\r\n'));
  const ret = execute(Buffer.from('Server: quan\r\n\r\naaabbb'));
  t.is(ret.dataBuf.toString(), 'aaabbb');
  t.throws(() => {
    execute(Buffer.from('ccc'));
  });
});

test('parseBody 9', (t) => {
  t.plan(6);
  const execute = decodeHttpResponse({
    onStartLine: () => {
      t.pass();
    },
    onHeader: () => {
      t.pass();
    },
    onBody: (chunk) => {
      t.is(chunk.toString(), 'aa');
    },
    onEnd: () => {
      t.pass();
    },
  });

  execute(Buffer.from('HTTP/1.1 200\r\n'));
  const ret = execute(Buffer.from('Content-Length: 2\r\n\r\naaabbb'));
  t.is(ret.dataBuf.toString(), 'abbb');
  t.throws(() => {
    execute(Buffer.from('ccc'));
  });
});
