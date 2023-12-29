import test from 'ava'; // eslint-disable-line
import { decodeHttpResponse } from '../../src/http/decodeHttp.mjs';
import { HttpParserError } from '../../src/http/errors.mjs';

test('parseStartLine fail 1', async (t) => {
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

  await execute(Buffer.from('HTTP/1.1 200'));
  try {
    await execute(Buffer.from('\n'));
    t.fail();
  } catch (error) {
    t.pass();
  }
});

test('parseStartLine fail 2', async (t) => {
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
  try {
    await execute(Buffer.from('HTTP/1.1 200s\r\n'));
    t.fail();
  } catch (error) {
    t.true(error instanceof HttpParserError);
  }
});

test('parseStartLine fail 3', async (t) => {
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
  try {
    await execute(Buffer.from('HTTP/1.1200\r\n'));
    t.fail();
  } catch (error) {
    t.true(error instanceof HttpParserError);
  }
});

test('parseStartLine fail 4', async (t) => {
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
  try {
    await execute(Buffer.from('HTTP/1.1 020\r\n'));
    t.fail();
  } catch (error) {
    t.true(error instanceof HttpParserError);
  }
});

test('parseStartLine', async (t) => {
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
  await execute(Buffer.from('HTTP/1.1 200\r'));
  await execute(Buffer.from('\n'));
});

test('parseHeaders fail 1', async (t) => {
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

  await execute(Buffer.from('HTTP/1.1 200\r\n'));
  try {
    await execute(Buffer.from('aaaaa,bbbbb\r\n'));
    t.fail();
  } catch (error) {
    t.true(error instanceof HttpParserError);
  }
});

test('parseHeaders fail content-length 1', async (t) => {
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

  await execute(Buffer.from('HTTP/1.1 200\r\n'));
  try {
    await execute(Buffer.from('content-length: -1\r\n'));
    t.fail();
  } catch (error) {
    t.true(error instanceof HttpParserError);
  }
});

test('parseHeaders fail content-length 2', async (t) => {
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

  await execute(Buffer.from('HTTP/1.1 200\r\n'));
  try {
    await execute(Buffer.from('content-length: 010\r\n'));
    t.fail();
  } catch (error) {
    t.true(error instanceof HttpParserError);
  }
});

test('parseHeaders fail content-length 3', async (t) => {
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

  await execute(Buffer.from('HTTP/1.1 200\r\n'));
  try {
    await execute(Buffer.from('content-length: 10.\r\n'));
    t.fail();
  } catch (error) {
    t.true(error instanceof HttpParserError);
  }
});

test('parseHeaders fail content-length 4', async (t) => {
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

  await execute(Buffer.from('HTTP/1.1 200\r\n'));
  try {
    await execute(Buffer.from('content-length: 10.4\r\n'));
    t.fail();
  } catch (error) {
    t.true(error instanceof HttpParserError);
  }
});

test('parseHeaders fail body exceed contentLength 1', async (t) => {
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

  await execute(Buffer.from('HTTP/1.1 200\r\n'));
  await execute(Buffer.from('\r\n'));
  try {
    await execute(Buffer.from('2'));
    t.fail();
  } catch (error) {
    t.pass();
  }
});

test('parseHeaders fail 6', async (t) => {
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

  await execute(Buffer.from('HTTP/1.1 200\r\n'));
  await execute(Buffer.from('Server: quan\r\n'));
  const ret = await execute(Buffer.from('\r\n'));
  t.is(ret.headers['content-length'], 0);
  try {
    await execute(Buffer.from('1'));
    t.fail();
  } catch (error) {
    t.pass();
  }
});

test('parseHeaders fail 7', async (t) => {
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

  await execute(Buffer.from('HTTP/1.1 200\r\n'));
  await execute(Buffer.from('Server: quan'));
  try {
    await execute(Buffer.from('\n'));
    t.fail();
  } catch (error) {
    t.pass();
  }
});

test('parseHeaders fail 8', async (t) => {
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

  await execute(Buffer.from('HTTP/1.1 200\r\n'));
  const ret = await execute(Buffer.from('\r\n'));
  t.true(ret.complete);
  try {
    await execute(Buffer.from('1'));
    t.fail();
  } catch (error) {
    t.pass();
  }
});

test('parseHeaders fail 9', async (t) => {
  t.plan(3);
  const execute = decodeHttpResponse({
    onStartLine: () => {
      t.pass();
    },
    onHeader: () => {
      t.pass();
      throw new Error('header fail');
    },
    onBody: () => {
      t.fail();
    },
    onEnd: () => {
      t.fail();
    },
  });

  await execute(Buffer.from('HTTP/1.1 200\r\n'));
  await execute(Buffer.from('Auth: 222\r\n'));
  try {
    await execute(Buffer.from('\r\n'));
    t.fail();
  } catch (error) {
    t.is(error.message, 'header fail');
  }
});

test('parseHeaders 0', async (t) => {
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

  await execute(Buffer.from('HTTP/1.1 200\r\n'));
  const ret = await execute(Buffer.from('\r\n'));
  t.is(ret.headers['content-length'], 0);
});

test('parseHeaders 1', async (t) => {
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

  let ret = await execute(Buffer.from('HTTP/1.1 200\r\n'));
  t.is(ret.statusCode, 200);
  await execute(Buffer.from('Content-Length: 3\r\n'));
  await execute(Buffer.from('Server: Quan\r\n'));
  await execute(Buffer.from('Auth: aaa\r\n'));
  ret = await execute(Buffer.from('\r\n'));
  t.deepEqual(ret.headers, {
    server: 'Quan',
    auth: 'aaa',
    'content-length': 3,
  });
});

test('parseHeaders 2', async (t) => {
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

  await execute(Buffer.from('HTTP/1.1 200\r\n'));
  await execute(Buffer.from('Content-Length: 3\r\n'));
  await execute(Buffer.from('set-cookie: aaa=111; path=/; httponly\r\n'));
  await execute(Buffer.from('Set-Cookie: bbb=222; path=/; httponly\r\n'));
  await execute(Buffer.from('set-Cookie: ccc=333; path=/; httponly\r\n'));
  await execute(Buffer.from('\r\n'));
});

test('parseHeaders 3', async (t) => {
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

  await execute(Buffer.from('HTTP/1.1 200\r\n'));
  await execute(Buffer.from('Content-Length: 3'));
  await execute(Buffer.from('\r\n'));
  await execute(Buffer.from('\r'));
  await execute(Buffer.from('\n'));
});

test('parseHeaders 4', async (t) => {
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

  await execute(Buffer.from('HTTP/1.1 200\r\n'));
  await execute(Buffer.from('Content-Length: 3\r\n'));
  await execute(Buffer.from('auth: 111\r\n'));
  await execute(Buffer.from('Auth: 222\r\n'));
  await execute(Buffer.from('\r\n'));
});

test('parseHeaders 5', async (t) => {
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

  await execute(Buffer.from('HTTP/1.1 200\r\n'));
  await execute(Buffer.from('Content-Length: 3\r\n'));
  await execute(Buffer.from('set-cookie: aaa=111; path=/; httponly\r\n'));
  await execute(Buffer.from('\r\n'));
});

test('parseHeaders 6', async (t) => {
  t.plan(2);
  const execute = decodeHttpResponse({
    onHeader: (state) => {
      t.deepEqual(state.headers, {
        'transfer-encoding': 'chunked',
      });
      t.deepEqual(state.headersRaw, ['Transfer-Encoding', 'chunked']);
    },
    onBody: () => {
      t.fail();
    },
    onEnd: () => {
      t.fail();
    },
  });

  await execute(Buffer.from('HTTP/1.1 200\r\n'));
  await execute(Buffer.from('Content-Length: 3\r\n'));
  await execute(Buffer.from('Transfer-Encoding: chunked\r\n'));
  await execute(Buffer.from('\r\n'));
});

test('parseBody fail 1', async (t) => {
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

  await execute(Buffer.from('HTTP/1.1 200\r\n'));
  await execute(Buffer.from('Content-Length: 3\r\n'));
  await execute(Buffer.from('\r\n'));
  await execute(Buffer.from('ab'));
  const ret = await execute(Buffer.from('cd'));
  t.is(ret.dataBuf.toString(), 'd');
  try {
    await execute(Buffer.from('e'));
    t.fail();
  } catch (error) {
    t.pass();
  }
});

test('parseBody fail 2', async (t) => {
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

  await execute(Buffer.from('HTTP/1.1 200\r\n'));
  await execute(Buffer.from('Content-Length: 3\r\n'));
  await execute(Buffer.from('\r\n'));
  await execute(Buffer.from('ab'));
  const ret = await execute(Buffer.from('c'));
  await t.is(ret.body.toString(), '');
  try {
    await execute(Buffer.from('d'));
    t.fail();
  } catch (error) {
    t.pass();
  }
});

test('parseBody fail 3', async (t) => {
  t.plan(1);
  const execute = decodeHttpResponse({
    onBody: () => {
      t.fail();
    },
    onEnd: () => {
      t.fail();
    },
  });

  await execute(Buffer.from('HTTP/1.1 200\r\n'));
  await execute(Buffer.from('transfer-encoding: chunked\r\n'));
  await execute(Buffer.from('\r\n'));
  try {
    await execute(Buffer.from('1s\r\n'));
    t.fail();
  } catch (error) {
    t.pass();
  }
});

test('parseBody fail 4', async (t) => {
  t.plan(1);
  const execute = decodeHttpResponse({
    onBody: () => {
      t.fail();
    },
    onEnd: () => {
      t.fail();
    },
  });

  await execute(Buffer.from('HTTP/1.1 200\r\n'));
  await execute(Buffer.from('transfer-encoding: chunked\r\n'));
  await execute(Buffer.from('\r\n'));
  await execute(Buffer.from('3\r\n'));
  try {
    await execute(Buffer.from('abcde'));
    t.fail();
  } catch (error) {
    t.pass();
  }
});

test('parseBody fail 5', async (t) => {
  t.plan(4);
  const execute = decodeHttpResponse({
    onBody: (chunk) => {
      t.is(chunk.toString(), 'abc');
    },
    onEnd: () => {
      t.pass();
    },
  });

  await execute(Buffer.from('HTTP/1.1 200\r\n'));
  await execute(Buffer.from('transfer-encoding: chunked\r\n'));
  await execute(Buffer.from('\r\n'));
  await execute(Buffer.from('3\r\n'));
  await execute(Buffer.from('abc\r\n'));
  await execute(Buffer.from('0\r\n'));
  const ret = await execute(Buffer.from('\r\naaa'));
  t.is(ret.dataBuf.toString(), 'aaa');
  try {
    await execute(Buffer.from('b'));
    t.fail();
  } catch (error) {
    t.pass();
  }
});

test('parseBody fail 6', async (t) => {
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

  await execute(Buffer.from('HTTP/1.1 200\r\n'));
  await execute(Buffer.from('transfer-encoding: chunked\r\n'));
  await execute(Buffer.from('\r\n'));
  await execute(Buffer.from('3\r\n'));
  await execute(Buffer.from('abc\r\n'));
  try {
    await execute(Buffer.from('12s\r\n'));
    t.fail();
  } catch (error) {
    t.pass();
  }
});

test('parseBody fail 7', async (t) => {
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

  await execute(Buffer.from('HTTP/1.1 200\r\n'));
  await execute(Buffer.from('transfer-encoding: chunked\r\n'));
  await execute(Buffer.from('\r\n'));
  await execute(Buffer.from('3'));
  await execute(Buffer.from('abc'));
  try {
    await execute(Buffer.from('12345678'));
    t.fail();
  } catch (error) {
    t.pass();
  }
});

test('parseBody 1', async (t) => {
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

  await execute(Buffer.from('HTTP/1.1 200\r\n'));
  await execute(Buffer.from('transfer-encoding: chunked\r\n'));
  await execute(Buffer.from('\r\n'));
  await execute(Buffer.from('3\r\n'));
  await execute(Buffer.from('abc\r\n'));
  await execute(Buffer.from('0\r\n'));
  const ret = await execute(Buffer.from('\r\n'));
  t.is(ret.body.toString(), '');
});

test('parseBody 2', async (t) => {
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

  await execute(Buffer.from('HTTP/1.1 200\r\n'));
  await execute(Buffer.from('transfer-encoding: chunked\r\n'));
  await execute(Buffer.from('\r\n'));
  await execute(Buffer.from('3\r\n'));
  await execute(Buffer.from('abc\r'));
  await execute(Buffer.from('\n'));
  await execute(Buffer.from('1\r\n'));
  await execute(Buffer.from('z'));
  await execute(Buffer.from('\r\n'));
  await execute(Buffer.from('0\r\n'));
  await execute(Buffer.from('\r\n'));
  try {
    await execute(Buffer.from('11\r\n'));
    t.fail();
  } catch (error) {
    t.pass();
  }
});

test('parseBody 3', async (t) => {
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

  const ret = await execute(Buffer.from('HTTP/1.1 200\r\ncontent-length: 4\r\n\r\nabcd'));

  t.is(ret.body.toString(), 'abcd');
  try {
    await execute(Buffer.from('bbb'));
    t.fail();
  } catch (error) {
    t.pass();
  }
});

test('parseBody 4', async (t) => {
  const execute = decodeHttpResponse();

  let ret = await execute(Buffer.from('HTTP/1.1 200\r\ncontent-length: 8\r\n\r\nabcd'));
  t.is(ret.body.toString(), 'abcd');
  t.false(ret.complete);
  ret = await execute(Buffer.from('efgg'));
  t.true(ret.complete);
  t.is(ret.body.toString(), 'abcdefgg');
  try {
    await execute(Buffer.from('aaa'));
    t.fail();
  } catch (error) {
    t.pass();
  }
});

test('parseBody 5', async (t) => {
  const execute = decodeHttpResponse();

  let ret = await execute(Buffer.from('HTTP/1.1 200\r\ntransfer-encoding: chunked\r\n\r\n8\r\nabcd'));
  t.is(ret.body.toString(), '');
  t.false(ret.complete);
  ret = await execute(Buffer.from('efgg\r\n'));
  t.false(ret.complete);
  t.is(ret.body.toString(), 'abcdefgg');
  await execute(Buffer.from('2\r\n'));
  ret = await execute(Buffer.from('d'));
  t.is(ret.body.toString(), 'abcdefgg');
  ret = await execute(Buffer.from('d\r\n'));
  t.false(ret.complete);
  t.is(ret.body.toString(), 'abcdefggdd');
  ret = await execute(Buffer.from('0\r'));
  t.false(ret.complete);
  ret = await execute(Buffer.from('\n'));
  t.false(ret.complete);
  ret = await execute(Buffer.from('\r\n'));
  t.true(ret.complete);
});

test('parseBody 6', async (t) => {
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

  await execute(Buffer.from('HTTP/1.1 200\r\n'));
  await execute(Buffer.from('transfer-encoding: chunked\r\n'));
  await execute(Buffer.from('\r\n'));
  await execute(Buffer.from('3\r\n'));
  await execute(Buffer.from('abc\r'));
  try {
    await execute(Buffer.from('\n'));
    t.fail();
  } catch (error) {
    t.pass();
  }
});

test('parseBody 7', async (t) => {
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

  await execute(Buffer.from('HTTP/1.1 200\r\n'));
  const ret = await execute(Buffer.from('Content-Length: 0\r\n\r\naaabbb'));
  t.is(ret.dataBuf.toString(), 'aaabbb');
  try {
    await execute(Buffer.from('ccc'));
    t.fail();
  } catch (error) {
    t.pass();
  }
});

test('parseBody 8', async (t) => {
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

  await execute(Buffer.from('HTTP/1.1 200\r\n'));
  const ret = await execute(Buffer.from('Server: quan\r\n\r\naaabbb'));
  t.is(ret.dataBuf.toString(), 'aaabbb');
  try {
    await execute(Buffer.from('ccc'));
    t.fail();
  } catch (error) {
    t.pass();
  }
});

test('parseBody 9', async (t) => {
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

  await execute(Buffer.from('HTTP/1.1 200\r\n'));
  const ret = await execute(Buffer.from('Content-Length: 2\r\n\r\naaabbb'));
  t.is(ret.dataBuf.toString(), 'abbb');
  try {
    await execute(Buffer.from('ccc'));
    t.fail();
  } catch (error) {
    t.pass();
  }
});
