import test from 'ava'; // eslint-disable-line
import { decodeHttpRequest } from '../../src/http/decodeHttp.mjs';

const waitFor = async (t = 100) => {
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, t);
  });
};

test('parseStartLine fail', async (t) => {
  try {
    await decodeHttpRequest()(Buffer.from('GET /test HTTP/1.1\n\n'));
    t.fail();
  } catch (error) {
    t.is(error.statusCode, 400);
  }
});

test('parseStartLine 1', async (t) => {
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

test('parseStartLine 2', async (t) => {
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

  await execute(Buffer.from('GET /test HTTP/1.1\r\n'));
  try {
    await execute(Buffer.from('Content-Length: 3\r\n\r\n'));
    t.fail();
  } catch (error) {
    t.pass();
  }
});

test('onHeader delay 1', async (t) => {
  t.plan(3);
  const execute = decodeHttpRequest({
    onStartLine: (ret) => {
      t.is(ret.httpVersion, '1.1');
      t.is(ret.method, 'GET');
      t.is(ret.href, '/test');
    },
    onHeader: async () => {
      await waitFor(2000);
      throw new Error('abcdef');
    },
    onBody: () => {
      t.fail();
    },
    onEnd: () => {
      t.fail();
    },
  });

  execute(Buffer.from('GET /test HTTP/1.1\r\n'));
  await execute(Buffer.from('Content-Length: 10\r\n\r\naa'));
});

test('onHeader delay 2', async (t) => {
  t.plan(3);
  const execute = decodeHttpRequest({
    onStartLine: (ret) => {
      t.is(ret.httpVersion, '1.1');
      t.is(ret.method, 'GET');
      t.is(ret.href, '/test');
    },
    onHeader: async () => {
      await waitFor(2000);
      throw new Error('abcdef');
    },
    onBody: () => {
      t.fail();
    },
    onEnd: () => {
      t.fail();
    },
  });
  execute(Buffer.from('GET /test HTTP/1.1\r\n'));
  setTimeout(async () => {
    await execute(Buffer.from('bbbb'));
  }, 200);
  await execute(Buffer.from('Content-Length: 10\r\n\r\naa'));
});

test('onHeader delay 3', async (t) => {
  t.plan(6);
  const execute = decodeHttpRequest({
    onStartLine: (ret) => {
      t.is(ret.httpVersion, '1.1');
      t.is(ret.method, 'GET');
      t.is(ret.href, '/test');
    },
    onHeader: async () => {
      await waitFor(1000);
    },
    onBody: () => {
      t.pass();
    },
    onEnd: () => {
      t.pass();
    },
  });

  setTimeout(async () => {
    await execute(Buffer.from('11bbbb'));
  }, 200);
  await execute(Buffer.from('GET /test HTTP/1.1\r\nContent-Length: 6\r\n\r\n'));
  t.pass();
});
