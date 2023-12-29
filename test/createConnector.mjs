import net from 'node:net';
import test from 'ava'; // eslint-disable-line
import createConnector from '../src/createConnector.mjs';

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

test('onError 1', async (t) => {
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

  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 100);
  });
});

test('onError 2', async (t) => {
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

  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 100);
  });
});

test('onError 3', async (t) => {
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
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 100);
  });
});
