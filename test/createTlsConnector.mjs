import tls from 'node:tls';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import test from 'ava'; // eslint-disable-line
import { createTlsConnector } from '../src/index.mjs';

const serverPort = 4710;

const keyBuf = readFileSync(path.resolve(process.cwd(), 'cert', 'quan.key'));
const certBuf = readFileSync(path.resolve(process.cwd(), 'cert', 'quan.pem'));

test.before(() => {
  const server = tls.createServer({
    key: keyBuf,
    cert: certBuf,
  }, () => {
  });
  server.listen(serverPort);
});

test.before(() => {
  const server = tls.createServer({
    key: keyBuf,
    cert: certBuf,
  }, (socket) => {
    setTimeout(() => {
      if (!socket.destroyed) {
        socket.destroy();
      }
    }, 200);
  });
  server.listen(serverPort + 1);
});

test.before(() => {
  const server = tls.createServer({
    key: keyBuf,
    cert: certBuf,
  }, (socket) => {
    if (socket.writable) {
      socket.write(Buffer.from('123'));
    }
  });
  server.listen(serverPort + 2);
});

test.before(() => {
  const server = tls.createServer({
    key: keyBuf,
    cert: certBuf,
  }, (socket) => {
    if (socket.writable) {
      socket.write(Buffer.from('123'));
    }
    setTimeout(() => {
      if (socket.writable) {
        socket.write(Buffer.from('456'));
      }
    }, 200);
  });
  server.listen(serverPort + 3);
});

test('1', async (t) => {
  const connector = createTlsConnector({
    hostname: '127.0.0.1',
    rejectUnauthorized: false,
    port: serverPort,
    onData: () => {
      t.fail();
    },
    onClose: () => {
      t.fail();
    },
    onConnect: () => {
      t.fail();
    },
    onError: () => {
      t.fail();
    },
  });
  t.false(connector.write(Buffer.from('123')));
  t.true(connector.getState().isActive);
  t.is(Buffer.concat(connector.getState().outgoingBufList).toString(), '123');
  connector();
  t.false(connector.getState().isActive);
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 200);
  });
  t.throws(() => {
    connector.write(Buffer.from('1'));
  });
});

test('3', async (t) => {
  t.plan(4);
  const connector = createTlsConnector({
    hostname: '127.0.0.1',
    rejectUnauthorized: false,
    port: serverPort,
    onData: () => {
      t.fail();
    },
    onClose: () => {
      t.fail();
    },
    onConnect: () => {
      t.pass();
    },
    onError: () => {
      t.fail();
    },
  });
  t.false(connector.getState().isConnect);
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 200);
  });
  t.true(connector.getState().isConnect);
  await new Promise((resolve) => {
    connector();
    setTimeout(() => {
      resolve();
    }, 1000);
  });
  t.false(connector.getState().isActive);
});

test('4', async (t) => {
  t.plan(7);
  const connector = createTlsConnector({
    hostname: '127.0.0.1',
    rejectUnauthorized: false,
    port: serverPort + 1,
    onData: () => {
      t.fail();
    },
    onClose: () => {
      t.pass();
    },
    onConnect: () => {
      t.is(connector.getState().outgoingBufList.length, 0);
      connector.write(Buffer.from('456'));
      t.is(connector.getState().outgoingBufList.length, 0);
    },
    onError: () => {
      t.fail();
    },
  });
  connector.write(Buffer.from('123'));
  t.is(connector.getState().outgoingBufList.length, 1);
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 500);
  });
  t.false(connector.getState().isConnect);
  t.false(connector.getState().isActive);
  t.throws(() => {
    connector.write(Buffer.from('123'));
  });
});

test('5', async (t) => {
  t.plan(3);
  let i = 0;
  createTlsConnector({
    hostname: '127.0.0.1',
    rejectUnauthorized: false,
    port: serverPort + 2,
    onData: (chunk) => {
      t.is(chunk.toString(), '123');
      t.is(i, 1);
      i++;
    },
    onClose: () => {
      t.fail();
    },
    onConnect: () => {
      t.is(i, 0);
      i++;
    },
    onError: () => {
      t.fail();
    },
  });
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 500);
  });
});

test('6', async (t) => {
  t.plan(2);
  const connector = createTlsConnector({
    hostname: '127.0.0.1',
    rejectUnauthorized: false,
    port: serverPort + 2,
    onData: () => {
      t.fail();
    },
    onClose: () => {
      t.fail();
    },
    onConnect: () => {
      t.pass();
      connector();
      t.throws(() => {
        connector.write(Buffer.from('123'));
      });
    },
    onError: () => {
      t.fail();
    },
  });
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 500);
  });
});

test('7', async (t) => {
  t.plan(5);
  const connector = createTlsConnector({
    hostname: '127.0.0.1',
    rejectUnauthorized: false,
    port: serverPort + 9,
    onData: () => {
      t.fail();
    },
    onClose: () => {
      t.fail();
    },
    onConnect: () => {
      t.fail();
    },
    onError: (error) => {
      t.true(error instanceof Error);
    },
  });
  t.true(connector.getState().isActive);
  connector.write(Buffer.from('123'));
  t.is(connector.getState().outgoingBufList.length, 1);
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 500);
  });
  t.false(connector.getState().isActive);
  t.throws(() => {
    connector.write(Buffer.from('123'));
  });
});

test('8', async (t) => {
  t.plan(3);
  let i = 0;
  const connector = createTlsConnector({
    hostname: '127.0.0.1',
    rejectUnauthorized: false,
    port: serverPort + 3,
    onData: (chunk) => {
      if (i === 0) {
        t.is(chunk.toString(), '123');
      } else if (i === 1) {
        t.is(chunk.toString(), '456');
      } else {
        t.fail();
      }
      i++;
    },
    onClose: () => {
      t.fail();
    },
    onConnect: () => {
      t.pass();
    },
    onError: () => {
      t.fail();
    },
  });
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 500);
  });
  connector();
});

test('9', async (t) => {
  t.plan(2);
  let i = 0;
  const connector = createTlsConnector({
    hostname: '127.0.0.1',
    rejectUnauthorized: false,
    port: serverPort + 3,
    onData: (chunk) => {
      if (i === 0) {
        t.is(chunk.toString(), '123');
      } else {
        t.fail();
      }
      i++;
      return false;
    },
    onClose: () => {
      t.fail();
    },
    onConnect: () => {
      t.pass();
    },
    onError: () => {
      t.fail();
    },
  });
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 500);
  });
  connector();
});

test('10', async (t) => {
  t.plan(3);
  let i = 0;
  const connector = createTlsConnector({
    hostname: '127.0.0.1',
    rejectUnauthorized: false,
    port: serverPort + 3,
    onData: (chunk) => {
      if (i === 0) {
        t.is(chunk.toString(), '123');
      } else if (i === 1) {
        t.is(chunk.toString(), '456');
      } else {
        t.fail();
      }
      i++;
      return false;
    },
    onClose: () => {
      t.fail();
    },
    onConnect: () => {
      t.pass();
    },
    onError: () => {
      t.fail();
    },
  });
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 100);
  });
  connector.resume();
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 500);
  });
  connector();
});

test('11', async (t) => {
  t.plan(1);
  const connector = createTlsConnector({
    hostname: '127.0.0.1',
    rejectUnauthorized: false,
    port: serverPort + 3,
    onData: () => {
      t.fail();
    },
    onClose: () => {
      t.fail();
    },
    onConnect: () => {
      t.pass();
      connector.pause();
    },
    onError: () => {
      t.fail();
    },
  });
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 500);
  });
  connector();
});
