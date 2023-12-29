import net from 'node:net';
import http from 'node:http';
import test from 'ava'; // eslint-disable-line
import request from '../../src/http/request.mjs';

const _getPort = () => {
  let _port = 5250;
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

test('error 1', async (t) => {
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

test('error 2', async (t) => {
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
