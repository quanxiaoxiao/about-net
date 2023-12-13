import test from 'ava'; // eslint-disable-line
import depack from '../src/depack.mjs';

test('1', (t) => {
  t.throws(() => {
    depack(5);
  });
  t.is(
    depack(2)(Buffer.concat([
      Buffer.from([0, 5]),
      Buffer.from([1, 2, 3]),
    ])),
    null,
  );
  let decode = depack(2);
  let ret = decode(Buffer.from([0]));
  t.is(ret, null);
  ret = decode(Buffer.from([4]));
  t.is(ret, null);
  ret = decode(Buffer.from([1, 2, 3]));
  t.is(ret, null);
  ret = decode(Buffer.from([4]));
  t.is(ret.size, 4);
  t.is(ret.payload.toString('hex'), '01020304');
  t.is(ret.buf.length, 0);
  decode = depack(1);
  ret = decode(Buffer.from([2]));
  t.is(ret, null);
  ret = decode(Buffer.from([1]));
  t.is(ret, null);
  ret = decode(Buffer.from([2, 3, 4]));
  t.is(ret.payload.toString('hex'), '0102');
  t.is(ret.buf.length, 2);
  t.is(ret.buf.toString('hex'), '0304');
  t.throws(() => {
    decode(Buffer.from([2]));
  });
});
