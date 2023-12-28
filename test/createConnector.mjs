import net from 'node:net';
import test from 'ava'; // eslint-disable-line
import createConnector from '../src/createConnector.mjs';

test('1', (t) => {
  t.throws(() => {
    t.is(createConnector({
      onData: () => {},
    }, null), null);
  });
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

test('2', async (t) => {
  t.plan(1);
  createConnector({
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
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 100);
  });
});
