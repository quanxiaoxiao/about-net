import test from 'ava'; // eslint-disable-line
import parseUrl from '../src/parseUrl.mjs';

test('1', (t) => {
  t.throws(() => {
    parseUrl('ftp://127.0.0.1:4433/aaa/bb');
  });
  t.deepEqual(parseUrl('http://www.aa.com'), {
    protocol: 'http:',
    port: 80,
    path: '/',
    hostname: 'www.aa.com',
  });
  t.deepEqual(parseUrl('http://www.aa.com:6666'), {
    protocol: 'http:',
    port: 6666,
    path: '/',
    hostname: 'www.aa.com',
  });
  t.deepEqual(parseUrl('http://www.aa.com:6666/'), {
    protocol: 'http:',
    port: 6666,
    path: '/',
    hostname: 'www.aa.com',
  });
  t.deepEqual(parseUrl('http://www.aa.com:6666/aaa/'), {
    protocol: 'http:',
    port: 6666,
    path: '/aaa/',
    hostname: 'www.aa.com',
  });
  t.deepEqual(parseUrl('http://www.aa.com:6666/aaa'), {
    protocol: 'http:',
    port: 6666,
    path: '/aaa',
    hostname: 'www.aa.com',
  });
  t.deepEqual(parseUrl('https://www.aa.com'), {
    protocol: 'https:',
    port: 443,
    path: '/',
    hostname: 'www.aa.com',
  });
  t.deepEqual(parseUrl('https://www.aa.com:6666'), {
    protocol: 'https:',
    port: 6666,
    path: '/',
    hostname: 'www.aa.com',
  });
  t.deepEqual(parseUrl('https://www.aa.com:6666?name=aaa'), {
    protocol: 'https:',
    port: 6666,
    path: '/?name=aaa',
    hostname: 'www.aa.com',
  });
  t.deepEqual(parseUrl('https://www.aa.com:6666/quan?name=aaa'), {
    protocol: 'https:',
    port: 6666,
    path: '/quan?name=aaa',
    hostname: 'www.aa.com',
  });
});
