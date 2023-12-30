import net from 'node:net';
import test from 'ava'; // eslint-disable-line
import createConnector from '../src/createConnector.mjs';

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

test('1', (t) => {
  t.is(createConnector({
    onData: () => {},
  }, () => {}), null);

  t.is(createConnector({
    onData: () => {},
  }, () => {
    const socket = net.Socket();
    socket.destroy();
    return socket;
  }), null);
});

test('onError at init 1', async (t) => {
  t.plan(2);
  const ret = createConnector({
    onConnect: () => {
      t.fail();
    },
    onData: () => {
      t.fail();
    },
    onError: () => {
      t.pass();
    },
  }, () => {
    const socket = net.Socket();
    socket.destroy();
    return socket;
  });

  t.is(ret, null);
  await waitFor();
});

test('onError at init 2', async (t) => {
  t.plan(2);
  const ret = createConnector({
    onConnect: () => {
      t.fail();
    },
    onData: () => {
      t.fail();
    },
    onError: () => {
      t.pass();
    },
  }, () => 'xxx');

  t.is(ret, null);
  await waitFor();
});

test('onError at init 3', async (t) => {
  t.plan(2);
  const connector = createConnector({
    onConnect: () => {
      t.fail();
    },
    onData: () => {
      t.fail();
    },
    onError: () => {
      t.pass();
    },
    onClose: () => {
      t.fail();
    },
  }, () => net.Socket());
  t.is(typeof connector, 'function');
  await waitFor();
});

test('onError at connect 1', async (t) => {
  t.plan(2);
  const connector = createConnector({
    onConnect: () => {
      t.fail();
    },
    onData: () => {
      t.fail();
    },
    onError: () => {
      t.pass();
    },
    onClose: () => {
      t.fail();
    },
  }, () => {
    const socket = net.Socket();
    socket.connect({
      host: '127.0.0.1',
      port: 9988,
    });
    return socket;
  });
  t.is(typeof connector, 'function');
  await waitFor();
});

test('onError at connect 2', async (t) => {
  t.plan(2);
  const connector = createConnector({
    onConnect: () => {
      t.fail();
    },
    onData: () => {
      t.fail();
    },
    onError: () => {
      t.pass();
    },
    onClose: () => {
      t.fail();
    },
  }, () => {
    const socket = net.Socket();
    socket.connect({
      host: '127.0.0.258',
      port: 9989,
    });
    return socket;
  });
  t.is(typeof connector, 'function');
  await waitFor(500);
});

test('onConnect and onClose', async (t) => {
  const port = getPort();
  const server = net.createServer((socket) => {
    setTimeout(() => {
      socket.destroy();
      server.close();
    }, 200);
  });
  server.listen(port);
  t.plan(3);
  const connector = createConnector({
    onConnect: () => {
      t.pass();
    },
    onData: () => {
      t.fail();
    },
    onError: () => {
      t.fail();
    },
    onClose: () => {
      t.pass();
    },
  }, () => {
    const socket = net.Socket();
    socket.connect({
      host: '127.0.0.1',
      port,
    });
    return socket;
  });
  t.is(typeof connector, 'function');
  await waitFor(1000);
});

test('onData 1', async (t) => {
  const port = getPort();
  const server = net.createServer((socket) => {
    socket.write('1');
    setTimeout(() => {
      socket.destroy();
      server.close();
    }, 200);
  });
  server.listen(port);
  t.plan(3);
  let i = 0;
  createConnector({
    onConnect: () => {
      t.is(i, 0);
      i++;
    },
    onData: (chunk) => {
      t.is(chunk.toString(), '1');
      t.is(i, 1);
      i++;
    },
  }, () => {
    const socket = net.Socket();
    socket.connect({
      host: '127.0.0.1',
      port,
    });
    return socket;
  });
  await waitFor(1000);
});

test('onData 2', async (t) => {
  const port = getPort();
  const server = net.createServer((socket) => {
    socket.write('1');
    setTimeout(() => {
      socket.destroy();
      server.close();
    }, 2000);
  });
  server.listen(port);
  const socket = net.Socket();
  socket.connect({
    host: '127.0.0.1',
    port,
  });
  await waitFor(200);
  t.plan(3);
  let i = 0;
  createConnector({
    onConnect: () => {
      t.is(i, 0);
      i++;
    },
    onData: (chunk) => {
      t.is(chunk.toString(), '1');
      t.is(i, 1);
      i++;
    },
  }, () => socket);
  await waitFor(1000);
});

test('write by socket close 1', async (t) => {
  const port = getPort();
  const server = net.createServer((socket) => {
    setTimeout(() => {
      socket.destroy();
      server.close();
    }, 200);
  });
  server.listen(port);
  const socket = net.Socket();
  socket.connect({
    host: '127.0.0.1',
    port,
  });
  t.plan(3);
  const connector = createConnector({
    onConnect: () => {
      t.pass();
    },
    onError: () => {
      t.fail();
    },
    onData: () => {
      t.fail();
    },
    onClose: () => {
      t.pass();
      t.throws(() => {
        connector.write('222');
      });
    },
  }, () => socket);
  await waitFor(1000);
});

test('write by socket close 2', async (t) => {
  const port = getPort();
  t.plan(3);
  const server = net.createServer((socket) => {
    socket.on('data', () => {
      t.fail();
    });
    setTimeout(() => {
      socket.destroy();
    }, 200);
  });
  server.listen(port);
  const connector = createConnector({
    onConnect: () => {
      t.pass();
      setTimeout(() => {
        t.throws(() => {
          connector.write('112');
        });
      }, 240);
    },
    onError: () => {
      t.fail();
    },
    onData: () => {
      t.fail();
    },
    onClose: () => {
      t.pass();
    },
  }, () => {
    const socket = net.Socket();
    socket.connect({
      host: '127.0.0.1',
      port,
    });
    return socket;
  });
  await waitFor(1000);
  server.close();
});

test('write1', async (t) => {
  const port = getPort();
  t.plan(5);
  const server = net.createServer((socket) => {
    socket.on('data', (chunk) => {
      t.is(chunk.toString(), '123');
    });
    setTimeout(() => {
      socket.destroy();
    }, 200);
  });
  server.listen(port);
  const connector = createConnector({
    onConnect: () => {
      t.is(connector.getState().outgoingBufList.length, 0);
    },
    onError: () => {
      t.fail();
    },
    onData: () => {
      t.fail();
    },
    onClose: () => {
      t.pass();
    },
  }, () => {
    const socket = net.Socket();
    socket.connect({
      host: '127.0.0.1',
      port,
    });
    return socket;
  });
  t.is(connector.getState().outgoingBufList.length, 0);
  connector.write(Buffer.from('123'));
  t.is(connector.getState().outgoingBufList.length, 1);
  await waitFor(1000);
  server.close();
});

test('end 1', async (t) => {
  const port = getPort();
  t.plan(2);
  const server = net.createServer((socket) => {
    socket.on('data', (chunk) => {
      t.is(chunk.toString(), '11');
    });
    socket.once('close', () => {
      setTimeout(() => {
        server.close();
      }, 200);
    });
  });
  server.listen(port);
  const connector = createConnector({
    onConnect: () => {
      t.pass();
      connector.end(Buffer.from('11'));
    },
    onError: () => {
      t.fail();
    },
    onData: () => {
      t.fail();
    },
    onClose: () => {
      t.fail();
    },
  }, () => {
    const socket = net.Socket();
    socket.connect({
      host: '127.0.0.1',
      port,
    });
    return socket;
  });
  await waitFor(1000);
});

test('end 2', async (t) => {
  const port = getPort();
  t.plan(0);
  const server = net.createServer(() => {
    t.fail();
  });
  server.listen(port);
  const connector = createConnector({
    onConnect: () => {
      t.fail();
    },
    onError: () => {
      t.fail();
    },
    onData: () => {
      t.fail();
    },
    onClose: () => {
      t.fail();
    },
  }, () => {
    const socket = net.Socket();
    socket.connect({
      host: '127.0.0.1',
      port,
    });
    return socket;
  });
  connector.end(Buffer.from('111'));
  await waitFor(1000);
  server.close();
});
