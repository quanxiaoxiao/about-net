import test from 'ava'; // eslint-disable-line
import convertHttpHeaders from '../../src/http/convertHttpHeaders.mjs';

test('1', (t) => {
  t.deepEqual(convertHttpHeaders(), []);
  t.deepEqual(convertHttpHeaders({}, 'quan.com'), ['Host', 'quan.com']);
  t.deepEqual(convertHttpHeaders({}, ''), []);
  t.deepEqual(convertHttpHeaders([], ''), []);
  t.deepEqual(convertHttpHeaders([], 'quan.com'), ['Host', 'quan.com']);
  t.deepEqual(convertHttpHeaders(null, 'quan.com'), ['Host', 'quan.com']);

  t.deepEqual(
    convertHttpHeaders({
      host: 'quan.com',
      'user-Agent': 'quan',
    }, 'rice.com'),
    ['Host', 'rice.com', 'user-Agent', 'quan'],
  );
  t.deepEqual(
    convertHttpHeaders({
      'user-Agent': 'quan',
    }, 'rice.com'),
    ['Host', 'rice.com', 'user-Agent', 'quan'],
  );
  t.deepEqual(
    convertHttpHeaders({
      'user-Agent': 'quan',
      Age: 33,
    }),
    ['user-Agent', 'quan', 'Age', 33],
  );
  t.deepEqual(
    convertHttpHeaders({
      'user-Agent': 'quan',
      'set-cookie': ['aaa', 333],
    }),
    ['user-Agent', 'quan', 'set-cookie', 'aaa', 'set-cookie', 333],
  );

  t.deepEqual(
    convertHttpHeaders([
      'user-Agent',
      'quan',
    ]),
    ['user-Agent', 'quan'],
  );
  t.deepEqual(
    convertHttpHeaders([
      'hoSt',
      'quan.com',
      'user-Agent',
      'quan',
    ], 'rice.com'),
    ['Host', 'rice.com', 'user-Agent', 'quan'],
  );
  t.deepEqual(
    convertHttpHeaders([
      'user-Agent',
      'quan',
    ], 'rice.com'),
    ['Host', 'rice.com', 'user-Agent', 'quan'],
  );
});
