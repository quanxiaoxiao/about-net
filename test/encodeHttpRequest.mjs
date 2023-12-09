import test from 'ava'; // eslint-disable-line
import encodeHttpRequest from '../src/encodeHttp.mjs'; // eslint-disable-line

test('onStartLine 1', (t) => {
  t.plan(3);
  const ret = encodeHttpRequest({
    method: 'get',
    path: '/test',
    headers: {
      cqq: '123',
    },
    onStartLine: (buf) => {
      t.true(buf.equals(Buffer.from('GET /test HTTP/1.1')));
    },
    onEnd: (size) => {
      t.is(size, 0);
    },
    body: null,
  });
  t.is(ret.toString(), 'GET /test HTTP/1.1\r\ncqq: 123\r\n\r\n');
});

test('onStartLine 2', (t) => {
  const ret = encodeHttpRequest({
    method: 'get',
    path: '/test?',
    body: null,
    headers: {
      cqq: '123',
    },
  });
  t.is(ret.toString(), 'GET /test? HTTP/1.1\r\ncqq: 123\r\n\r\n');
});

test('onHeader 1', (t) => {
  t.plan(2);
  const ret = encodeHttpRequest({
    method: 'get',
    path: '/test',
    headers: {
      cqq: '123',
    },
    body: null,
    onHeader: (buf) => {
      t.true(buf.equals(Buffer.from('GET /test HTTP/1.1\r\ncqq: 123\r\n')));
    },
  });
  t.is(ret.toString(), 'GET /test HTTP/1.1\r\ncqq: 123\r\n\r\n');
});

test('onHeader 2', (t) => {
  t.plan(4);
  const ret = encodeHttpRequest({
    method: 'get',
    path: '/test',
    body: null,
    headers: {
      cqq: '123',
    },
    onStartLine: () => {
      t.pass();
    },
    onHeader: (buf) => {
      t.true(buf.equals(Buffer.from('cqq: 123\r\n')));
    },
    onEnd: (size) => {
      t.is(size, 0);
    },
  });
  t.is(ret.toString(), 'GET /test HTTP/1.1\r\ncqq: 123\r\n\r\n');
});

test('onHeader 3', (t) => {
  const ret = encodeHttpRequest({
    method: 'get',
    path: '/test',
    body: null,
    headers: {
      cqq: '123',
    },
  });
  t.is(ret.toString(), 'GET /test HTTP/1.1\r\ncqq: 123\r\n\r\n');
});

test('onHeader 4', (t) => {
  const ret = encodeHttpRequest({
    method: 'get',
    path: '/test',
    headers: {
      cqq: '123',
      quan: 'bbb',
    },
    body: null,
  });
  t.is(ret.toString(), 'GET /test HTTP/1.1\r\ncqq: 123\r\nquan: bbb\r\n\r\n');
});

test('onEnd 2', (t) => {
  t.plan(2);
  const ret = encodeHttpRequest({
    method: 'get',
    path: '/test',
    body: null,
    onEnd: (size) => {
      t.is(size, 0);
    },
  });
  t.is(ret.toString(), 'GET /test HTTP/1.1\r\n\r\n');
});

test('onEnd 3', (t) => {
  const ret = encodeHttpRequest({
    method: 'get',
    path: '/test',
    headers: {
      cqq: '123',
    },
    body: null,
  });
  t.is(ret.toString(), 'GET /test HTTP/1.1\r\ncqq: 123\r\n\r\n');
});

test('onEnd 4', (t) => {
  const ret = encodeHttpRequest({
    method: 'get',
    path: '/test?c=a',
    body: null,
    headers: {
      cqq: '123',
    },
  });
  t.is(ret.toString(), 'GET /test?c=a HTTP/1.1\r\ncqq: 123\r\n\r\n');
});

test('body 1', (t) => {
  t.plan(3);
  const ret = encodeHttpRequest({
    method: 'get',
    path: '/test?',
    headers: {
      cqq: '123',
    },
    body: 'quan',
    onHeader: (buf) => {
      t.true(buf.equals(Buffer.concat([
        Buffer.from('GET /test? HTTP/1.1\r\n'),
        Buffer.from('cqq: 123\r\n'),
        Buffer.from('Content-Length: 4\r\n'),
      ])));
    },
    onEnd: (size) => {
      t.is(size, 4);
    },
  });
  t.is(ret.toString(), 'GET /test? HTTP/1.1\r\ncqq: 123\r\nContent-Length: 4\r\n\r\nquan');
});

test('body 2', (t) => {
  t.plan(3);
  const ret = encodeHttpRequest({
    method: 'get',
    path: '/test?name=bb',
    headers: {
      cqq: '123',
      'Content-Length': 9,
    },
    body: 'quan',
    onHeader: (buf) => {
      t.true(buf.equals(Buffer.concat([
        Buffer.from('GET /test?name=bb HTTP/1.1\r\n'),
        Buffer.from('cqq: 123\r\n'),
        Buffer.from('Content-Length: 4\r\n'),
      ])));
    },
    onEnd: (size) => {
      t.is(size, 4);
    },
  });
  t.is(ret.toString(), 'GET /test?name=bb HTTP/1.1\r\ncqq: 123\r\nContent-Length: 4\r\n\r\nquan');
});

test('onBody 1', (t) => {
  t.plan(4);
  const execute = encodeHttpRequest({
    method: 'get',
    path: '/test',
    headers: {
      cqq: '123',
    },
    onHeader: (buf) => {
      t.true(buf.equals(Buffer.concat([
        Buffer.from('GET /test HTTP/1.1\r\n'),
        Buffer.from('cqq: 123\r\n'),
        Buffer.from('Transfer-Encoding: chunked\r\n'),
      ])));
    },
    onEnd: (size) => {
      t.is(size, 3);
    },
  });

  let ret = execute(Buffer.from('123'));
  t.is(ret.toString(), '3\r\n123\r\n');
  ret = execute();
  t.is(ret.toString(), '0\r\n\r\n');
});

test('onBody 2', (t) => {
  t.plan(5);
  const execute = encodeHttpRequest({
    method: 'get',
    path: '/test',
    headers: {
      cqq: '123',
    },
    onEnd: (size) => {
      t.is(size, 4);
    },
  });

  let ret = execute(Buffer.from('123'));
  t.is(ret.toString(), 'GET /test HTTP/1.1\r\ncqq: 123\r\nTransfer-Encoding: chunked\r\n\r\n3\r\n123\r\n');
  ret = execute(Buffer.from('4'));
  t.is(ret.toString(), '1\r\n4\r\n');
  ret = execute();
  t.is(ret.toString(), '0\r\n\r\n');
  t.throws(() => {
    execute(Buffer.from('88'));
  });
});

test('onBody 3', (t) => {
  t.plan(3);
  const execute = encodeHttpRequest({
    method: 'get',
    path: '/test',
    headers: {
      cqq: '123',
    },
    onHeader: (buf) => {
      t.true(buf.equals(Buffer.concat([
        Buffer.from('GET /test HTTP/1.1\r\n'),
        Buffer.from('cqq: 123\r\n'),
        Buffer.from('Transfer-Encoding: chunked\r\n'),
      ])));
    },
    onEnd: (size) => {
      t.is(size, 20);
    },
  });
  const bufList = [];

  bufList.push(execute(Buffer.from('123')));
  bufList.push(execute(Buffer.from('0123456789abcdefg')));
  bufList.push(execute());
  t.true(Buffer.concat(bufList).equals(Buffer.concat([
    Buffer.from('3\r\n123\r\n'),
    Buffer.from('11\r\n0123456789abcdefg\r\n'),
    Buffer.from('0\r\n\r\n'),
  ])));
});

test('onBody 4', (t) => {
  t.plan(4);
  const execute = encodeHttpRequest({
    method: 'get',
    path: '/test',
    headers: {
      cqq: '123',
    },
    onStartLine: (buf) => {
      t.is(buf.toString(), 'GET /test HTTP/1.1');
    },
    onHeader: (buf) => {
      t.true(buf.equals(Buffer.concat([
        Buffer.from('cqq: 123\r\n'),
        Buffer.from('Transfer-Encoding: chunked\r\n'),
      ])));
    },
    onEnd: (size) => {
      t.is(size, 3);
    },
  });
  const bufList = [];

  bufList.push(execute(Buffer.from('123')));
  bufList.push(execute());
  t.is(Buffer.concat(bufList).toString(), '3\r\n123\r\n0\r\n\r\n');
});
