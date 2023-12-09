import test from 'ava'; // eslint-disable-line
import filterHttpHeaders from '../src/filterHttpHeaders.mjs';

test('1', (t) => {
  t.deepEqual(
    filterHttpHeaders(['aa', 'bb', 'cc', 'dd'], []),
    ['aa', 'bb', 'cc', 'dd'],
  );
  t.deepEqual(
    filterHttpHeaders(['aa', 'bb', 'cc', 'dd'], ['bb']),
    ['aa', 'bb', 'cc', 'dd'],
  );
  t.deepEqual(
    filterHttpHeaders(['aa', 'bb', 'cc', 'dd'], ['cc']),
    ['aa', 'bb'],
  );
  t.deepEqual(
    filterHttpHeaders(['aA', 'bb', 'cC', 'dd'], ['cc']),
    ['aA', 'bb'],
  );
  t.deepEqual(
    filterHttpHeaders(['aA', 'bb', 'cC', 'dd'], ['cc', 'aa']),
    [],
  );
  t.deepEqual(
    filterHttpHeaders(['user-agent', 'quan', 'content-length', '333', 'transfer-encoding', 'chunked'], ['Content-length', 'transfer-encoding']),
    ['user-agent', 'quan'],
  );
});
