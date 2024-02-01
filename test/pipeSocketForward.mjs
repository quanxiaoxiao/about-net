import net from 'node:net';
import test from 'ava'; // eslint-disable-line
import pipeSocketForward from '../src/pipeSocketForward.mjs';

const _getPort = () => {
  let _port = 5750;
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

test('222', async (t) => {
  t.plan(2);
  const port = getPort();
  const server = net.createServer(() => {
    t.pass();
  });

  server.listen(port);

  const socket = net.connect({
    host: '127.0.0.1',
    port,
  });

  await waitFor(50);

  pipeSocketForward(
    socket,
    {
      onError: () => {
        t.pass();
      },
      onClose: () => {
        t.fail();
      },
      onConnect: () => {
        t.fail();
      },
      getConnect: () => net.connect({
        host: '127.0.0.1',
        port: 10001,
      }),
    },
  );
  await waitFor(500);
  server.close();
});

test('1', async (t) => {
  const port = getPort();
  t.plan(1);
  const server = net.createServer(() => {
    t.fail();
  });
  server.listen(port);
  const socket = net.Socket();
  pipeSocketForward(socket, {
    onError: () => {
      t.pass();
    },
    onClose: () => {
      t.fail();
    },
    onConnect: () => {
      t.fail();
    },
    getConnect: () => {
      t.fail();
      return net.connect({
        host: '127.0.0.1',
        port,
      });
    },
  });
  await waitFor();
  server.close();
});

test('3', async (t) => {
  const port1 = getPort();
  const port2 = getPort();
  t.plan(7);
  const server1 = net.createServer((socket) => {
    t.pass();
    socket.on('data', (chunk) => {
      t.is(chunk.toString(), '123');
      socket.write(Buffer.from('456'));
    });
  });
  const server2 = net.createServer((socket) => {
    t.pass();
    socket.on('data', (chunk) => {
      t.is(chunk.toString(), '456');
    });
    setTimeout(() => {
      t.false(socket.destroyed);
      socket.destroy();
    }, 100);
  });

  server1.listen(port1);
  server2.listen(port2);

  const socket = net.connect({
    host: '127.0.0.1',
    port: port1,
  });

  await waitFor(50);

  pipeSocketForward(
    socket,
    {
      onError: () => {
        t.fail();
      },
      onClose: () => {
        t.pass();
      },
      onConnect: () => {
        socket.write(Buffer.from('123'));
        t.pass();
      },
      getConnect: () => net.connect({
        host: '127.0.0.1',
        port: port2,
      }),
    },
  );
  await waitFor(1000);
  server1.close();
  server2.close();
});

test('4', async (t) => {
  const port1 = getPort();
  const port2 = getPort();
  t.plan(5);
  const server1 = net.createServer((socket) => {
    t.pass();
    socket.on('data', (chunk) => {
      t.is(chunk.toString(), '123');
      socket.destroy();
    });
  });
  const server2 = net.createServer((socket) => {
    socket.write(Buffer.from('123'));
    t.pass();
  });

  server1.listen(port1);
  server2.listen(port2);

  const socket = net.connect({
    host: '127.0.0.1',
    port: port1,
  });

  await waitFor(50);

  pipeSocketForward(
    socket,
    {
      onError: () => {
        t.fail();
      },
      onClose: () => {
        t.pass();
      },
      onConnect: () => {
        t.pass();
      },
      getConnect: () => net.connect({
        host: '127.0.0.1',
        port: port2,
      }),
    },
  );
  await waitFor(1000);
  server1.close();
  server2.close();
});

test('5', async (t) => {
  const port1 = getPort();
  const port2 = getPort();
  t.plan(2);
  const server1 = net.createServer(() => {
    t.pass();
  });
  const server2 = net.createServer(() => {
    t.fail();
  });

  server1.listen(port1);
  server2.listen(port2);

  const socket = net.connect({
    host: '127.0.0.1',
    port: port1,
  });

  await waitFor(50);

  socket.destroy();

  pipeSocketForward(
    socket,
    {
      onError: () => {
        t.pass();
      },
      onClose: () => {
        t.fail();
      },
      onConnect: () => {
        t.fail();
      },
      getConnect: () => {
        t.fail();
        return net.connect({
          host: '127.0.0.1',
          port: port2,
        });
      },
    },
  );
  await waitFor(1000);
  server1.close();
  server2.close();
});

test('6', async (t) => {
  const port1 = getPort();
  const port2 = getPort();
  t.plan(4);
  const server1 = net.createServer(() => {
    t.pass();
  });
  const server2 = net.createServer(() => {
    t.pass();
  });

  server1.listen(port1);
  server2.listen(port2);

  const socket = net.connect({
    host: '127.0.0.1',
    port: port1,
  });

  pipeSocketForward(
    socket,
    {
      onError: () => {
        t.fail();
      },
      onClose: () => {
        t.pass();
      },
      onConnect: () => {
        t.pass();
        setTimeout(() => {
          socket.end();
        }, 500);
      },
      getConnect: () => net.connect({
        host: '127.0.0.1',
        port: port2,
      }),
    },
  );

  await waitFor(2000);

  server1.close();
  server2.close();
});

test('7', async (t) => {
  const port1 = getPort();
  const port2 = getPort();
  t.plan(4);
  const server1 = net.createServer(() => {
    t.pass();
  });
  const server2 = net.createServer((socket) => {
    t.pass();
    setTimeout(() => {
      socket.end();
    }, 500);
  });

  server1.listen(port1);
  server2.listen(port2);

  const socket = net.connect({
    host: '127.0.0.1',
    port: port1,
  });

  pipeSocketForward(
    socket,
    {
      onError: () => {
        t.fail();
      },
      onClose: () => {
        t.pass();
      },
      onConnect: () => {
        t.pass();
      },
      getConnect: () => net.connect({
        host: '127.0.0.1',
        port: port2,
      }),
    },
  );

  await waitFor(2000);

  server1.close();
  server2.close();
});

test('8', async (t) => {
  const port1 = getPort();
  const port2 = getPort();
  t.plan(4);
  const server1 = net.createServer((socket) => {
    t.pass();
    setTimeout(() => {
      socket.end();
    }, 500);
  });
  const server2 = net.createServer(() => {
    t.pass();
  });

  server1.listen(port1);
  server2.listen(port2);

  const socket = net.connect({
    host: '127.0.0.1',
    port: port1,
  });

  pipeSocketForward(
    socket,
    {
      onError: () => {
        t.fail();
      },
      onClose: () => {
        t.pass();
      },
      onConnect: () => {
        t.pass();
      },
      getConnect: () => net.connect({
        host: '127.0.0.1',
        port: port2,
      }),
    },
  );

  await waitFor(2000);

  server1.close();
  server2.close();
});
