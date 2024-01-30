import test from 'ava'; // eslint-disable-line
import { decodeHttpRequest } from '../../src/http/decodeHttp.mjs';

const waitFor = async (t = 100) => {
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, t);
  });
};

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
  t.plan(4);
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

  try {
    execute(Buffer.from('GET /test HTTP/1.1\r\n'));
    await execute(Buffer.from('Content-Length: 10\r\n\r\naa'));
    t.fail();
  } catch (error) {
    t.pass();
  }
});

test('onHeader delay 2', async (t) => {
  t.plan(4);
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

  try {
    execute(Buffer.from('GET /test HTTP/1.1\r\n'));
    setTimeout(async () => {
      await execute(Buffer.from('bbbb'));
    }, 200);
    await execute(Buffer.from('Content-Length: 10\r\n\r\naa'));
    t.fail();
  } catch (error) {
    t.pass();
  }
});
