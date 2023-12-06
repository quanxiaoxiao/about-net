import test from 'ava'; // eslint-disable-line
import readHttpLine from '../src/readHttpLine.mjs';

test('fail', (t) => {
  t.throws(() => {
    readHttpLine(
      Buffer.from('GET / HTTP/1.1\n'),
    );
  });
  t.throws(() => {
    readHttpLine(
      Buffer.from('GET / HTTP/1.1\r\n'),
      999,
    );
  });
  t.throws(() => {
    readHttpLine(
      Buffer.from('GET /1234567890 HTTP/1.1\r\n'),
      0,
      'start line',
      12,
    );
  });
  t.throws(() => {
    readHttpLine(
      Buffer.from('GET / HTTP/1.1\r\n'),
      'GET / HTTP/1.1'.length + 1,
    );
  });
  t.throws(() => {
    readHttpLine(
      Buffer.from('\n'),
    );
  });
});

test('1', (t) => {
  let ret = readHttpLine(
    Buffer.from('GET / HTTP/1.1\r\n'),
  );
  t.is(ret.toString(), 'GET / HTTP/1.1');
  ret = readHttpLine(
    Buffer.from('GET /1234567890 HTTP/1.1\r\n'),
    0,
  );
  t.is(ret.toString(), 'GET /1234567890 HTTP/1.1');
  ret = readHttpLine(
    Buffer.from('GET / HTTP/1.1\r\n'),
    2,
  );
  t.is(ret.toString(), 'T / HTTP/1.1');
  ret = readHttpLine(
    Buffer.from('GET / HTTP/1.1\r\n'),
    'GET / HTTP/1.1'.length,
  );
  t.is(ret.toString(), '');
  ret = readHttpLine(
    Buffer.from('\r'),
  );
  t.is(ret, null);
});
