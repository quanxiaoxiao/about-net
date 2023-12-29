import net from 'node:net';
import http from 'node:http';
import test from 'ava'; // eslint-disable-line
import encodeHttp from '../../src/http/encodeHttp.mjs';
import request from '../../src/http/request.mjs';

const _getPort = () => {
  let _port = 5350;
  return () => {
    const port = _port;
    _port += 1;
    return port;
  };
};

const getPort = _getPort();

const waitFor = async (t = 100) => {
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, t);
  });
};

test('error socket 1', async (t) => {
  try {
    await request({
      path: '/aaa',
    }, () => {
      const socket = net.Socket();
      return socket;
    });
    t.fail();
  } catch (error) {
    t.pass();
  }
  await waitFor();
});

test('error can\'t connect 2', async (t) => {
  try {
    await request({
      path: '/aaa',
    }, () => {
      const socket = net.Socket();
      socket.connect({
        host: '127.0.0.1',
        port: 9989,
      });
      return socket;
    });
    t.fail();
  } catch (error) {
    t.pass();
  }
  await waitFor();
});

test('error server close error 1', async (t) => {
  t.plan(2);
  const port = getPort();
  const server = net.createServer((socket) => {
    socket.on('data', (chunk) => {
      t.is(chunk.toString(), encodeHttp({
        path: '/',
        method: 'GET',
        body: null,
      }).toString());
    });
    setTimeout(() => {
      socket.end();
    }, 100);
  });
  server.listen(port);
  try {
    await request({}, () => {
      const socket = net.Socket();
      socket.connect({
        host: '127.0.0.1',
        port,
      });
      return socket;
    });
    t.fail();
  } catch (error) {
    t.pass();
  }
  await waitFor();
  server.close();
});
