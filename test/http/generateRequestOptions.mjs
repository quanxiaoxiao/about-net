import test from 'ava'; // eslint-disable-line
import generateRequestOptions from '../../src/http/generateRequestOptions.mjs';

test('1', (t) => {
  t.throws(() => {
    generateRequestOptions({
      hostname: '',
    });
  });
  let ret = generateRequestOptions({
    hostname: 'www.test.com',
    path: '/aaa',
    method: 'GET',
    body: null,
  });
  t.deepEqual(ret, {
    hostname: 'www.test.com',
    path: '/aaa',
    headers: ['Host', 'www.test.com'],
    method: 'GET',
    body: null,
  });
  ret = generateRequestOptions({
    hostname: 'www.test.com',
    path: '/aaa',
    headers: {
      host: 'www.bbb.com',
      Name: 'aaa',
    },
    method: 'GET',
    body: null,
  });
  t.deepEqual(ret, {
    hostname: 'www.test.com',
    path: '/aaa',
    headers: ['host', 'www.bbb.com', 'Name', 'aaa'],
    method: 'GET',
    body: null,
  });
  ret = generateRequestOptions({
    hostname: 'www.test.com',
    path: '/aaa',
    headers: ['host', 'www.bbb.com', 'foo', 'bar'],
    method: 'GET',
    body: null,
  });
  t.deepEqual(ret, {
    hostname: 'www.test.com',
    path: '/aaa',
    headers: ['host', 'www.bbb.com', 'foo', 'bar'],
    method: 'GET',
    body: null,
  });
  ret = generateRequestOptions({
    hostname: 'www.test.com',
    path: '/aaa',
    headers: ['foo', 'bar'],
    method: 'GET',
    body: null,
  });
  t.deepEqual(ret, {
    hostname: 'www.test.com',
    path: '/aaa',
    headers: ['foo', 'bar', 'Host', 'www.test.com'],
    method: 'GET',
    body: null,
  });
  ret = generateRequestOptions({
    hostname: 'www.test.com',
    path: '/aaa',
    headers: {
      Name: 'aaa',
    },
    method: 'GET',
    body: null,
  });
  t.deepEqual(ret, {
    hostname: 'www.test.com',
    path: '/aaa',
    headers: ['Name', 'aaa', 'Host', 'www.test.com'],
    method: 'GET',
    body: null,
  });
});
