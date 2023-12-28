import test from 'ava'; // eslint-disable-line
import enpack from '../src/enpack.mjs';

test('1', (t) => {
  t.throws(() => {
    enpack(Buffer.from('123'), 5);
  });
  t.throws(() => {
    enpack(Buffer.from('123'), 3);
  });
  t.throws(() => {
    enpack(111);
  });
  t.true(enpack(Buffer.from([2, 3, 4]), 1).equals(Buffer.from([3, 2, 3, 4])));
  t.true(enpack(Buffer.from([2, 3, 4]), 2).equals(Buffer.from([0, 3, 2, 3, 4])));
  t.true(enpack(Buffer.from([2, 3, 4]), 4).equals(Buffer.from([0, 0, 0, 3, 2, 3, 4])));
});
