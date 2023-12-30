import net from 'node:net';
import test from 'ava'; // eslint-disable-line
import encodeHttp from '../../src/http/encodeHttp.mjs';
import { HttpEncodeError } from '../../src/errors.mjs';
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

test('server response error 1', async (t) => {
  t.plan(1);
  const port = getPort();
  const server = net.createServer((socket) => {
    socket.on('data', () => {
    });
    socket.write('HTTP/1.1 200\r\nContent-Length: 3\r\n\r\nab');
    setTimeout(() => {
      socket.destroy();
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
  await waitFor(500);
  server.close();
});

test('trigger onRequest error 1', async (t) => {
  t.plan(2);
  const port = getPort();
  const server = net.createServer((socket) => {
    socket.on('data', () => {
      t.fail();
      socket.write('HTTP/1.1 200\r\nContent-Length: 3\r\n\r\nabc');
    });
  });
  server.listen(port);
  try {
    const ret = await request({
      path: '/',
      onRequest: async () => {
        t.pass();
        await waitFor(100);
        throw new Error('aaa');
      },
    }, () => {
      const socket = net.Socket();
      socket.connect({
        host: '127.0.0.1',
        port,
      });
      return socket;
    });
    console.log(ret);
    t.fail();
  } catch (error) {
    t.is(error.message, 'aaa');
  }
  await waitFor(500);
  server.close();
});

test('trigger onRequest error 2', async (t) => {
  t.plan(2);
  const port = getPort();
  const server = net.createServer(async (socket) => {
    socket.on('data', () => {
      t.fail();
    });
    await waitFor(100);
    socket.destroy();
  });
  server.listen(port);
  try {
    await request({
      path: '/',
      onOutgoing: () => {
        t.fail();
      },
      onRequest: async () => {
        t.pass();
        await waitFor(200);
      },
    }, () => {
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
  await waitFor(500);
  server.close();
});

test('trigger onRequest error 3', async (t) => {
  t.plan(3);
  const port = getPort();
  const server = net.createServer(async (socket) => {
    socket.on('close', () => {
      t.pass();
    });
    socket.on('data', () => {
      t.fail();
    });
  });
  server.listen(port);
  try {
    await request({
      path: '/',
      onOutgoing: () => {
        t.fail();
      },
      onRequest: async (opt) => {
        t.is(opt.body, null);
        opt.body = 11;
      },
    }, () => {
      const socket = net.Socket();
      socket.connect({
        host: '127.0.0.1',
        port,
      });
      return socket;
    });
    t.fail();
  } catch (error) {
    t.true(error instanceof HttpEncodeError);
  }
  await waitFor(500);
  server.close();
});

test('1', async (t) => {
  t.plan(5);
  const port = getPort();
  const server = net.createServer((socket) => {
    socket.on('data', (chunk) => {
      t.is(chunk.toString(), encodeHttp({
        path: '/',
        method: 'GET',
        body: null,
      }).toString());
    });
    socket.on('close', () => {
      t.pass();
    });
    setTimeout(() => {
      socket.write(encodeHttp({
        statusCode: 200,
        body: 'ok',
      }));
    }, 100);
  });
  server.listen(port);
  const ret = await request({
    onOutgoing: (chunk) => {
      t.is(chunk.toString(), 'GET / HTTP/1.1\r\n\r\n');
    },
    onIncoming: (chunk) => {
      t.is(chunk.toString(), 'HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\nok');
    },
  }, () => {
    const socket = net.Socket();
    socket.connect({
      host: '127.0.0.1',
      port,
    });
    return socket;
  });
  t.is(ret.body.toString(), 'ok');
  await waitFor();
  server.close();
});

test('2', async (t) => {
  t.plan(1);
  const port = getPort();
  const server = net.createServer((socket) => {
    socket.on('data', () => {
    });
    const encode = encodeHttp({
      statusCode: 200,
    });
    setTimeout(() => {
      socket.write(encode('12'));
      setTimeout(() => {
        socket.write(encode('34'));
        socket.write(encode());
      }, 100);
    }, 100);
  });
  server.listen(port);
  const ret = await request({}, () => {
    const socket = net.Socket();
    socket.connect({
      host: '127.0.0.1',
      port,
    });
    return socket;
  });
  t.is(ret.body.toString(), '1234');
  await waitFor(500);
  server.close();
});

test('3', async (t) => {
  t.plan(1);
  const port = getPort();
  const server = net.createServer((socket) => {
    socket.on('data', () => {
    });
    socket.write('HTTP/1.1 200\r\nContent-Length: 3\r\n\r\nabcdefg');
  });
  server.listen(port);
  const ret = await request({}, () => {
    const socket = net.Socket();
    socket.connect({
      host: '127.0.0.1',
      port,
    });
    return socket;
  });
  t.is(ret.body.toString(), 'abc');
  await waitFor(500);
  server.close();
});

test('4', async (t) => {
  t.plan(1);
  const port = getPort();
  const server = net.createServer((socket) => {
    socket.on('data', () => {
    });
    socket.end('HTTP/1.1 200\r\nContent-Length: 3\r\n\r\nabcdefg');
  });
  server.listen(port);
  const ret = await request({}, () => {
    const socket = net.Socket();
    socket.connect({
      host: '127.0.0.1',
      port,
    });
    return socket;
  });
  t.is(ret.body.toString(), 'abc');
  await waitFor(500);
  server.close();
});

test('6', async (t) => {
  t.plan(1);
  const port = getPort();
  const server = net.createServer((socket) => {
    socket.on('data', () => {
    });
    socket.end('HTTP/1.1 200\r\nContent-Length: 3\r\n\r\nabcdefg');
  });
  server.listen(port);
  const ret = await request({
    onBody: () => {},
  }, () => {
    const socket = net.Socket();
    socket.connect({
      host: '127.0.0.1',
      port,
    });
    return socket;
  });
  t.is(ret.body.length, 0);
  await waitFor(500);
  server.close();
});

test('read stream 1', (t) => {
  t.pass();
});
