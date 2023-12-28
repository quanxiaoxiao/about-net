import test from 'ava'; // eslint-disable-line
import convertToBuf from '../src/convertToBuf.mjs';

test('1', (t) => {
  t.is(convertToBuf(Buffer.from('123')).toString(), '123');
  t.is(convertToBuf('123').toString(), '123');
  t.true(Buffer.isBuffer(convertToBuf('123')));
  t.throws(() => {
    convertToBuf(12);
  });
});
