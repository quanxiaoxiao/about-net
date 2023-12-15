/* eslint no-use-before-define: 0 */
import net from 'node:net';

const calcConnectTime = async ({
  address,
  port,
}) => {
  const state = {
    complete: false,
    value: null,
    now: null,
    tick: null,
  };
  return new Promise((resolve, reject) => {
    state.now = performance.now();
    const client = net.createConnection({
      host: address,
      port,
    }, () => {
      state.value = performance.now() - state.now;
      client.end();
    });

    function handleError() {
      client.off('end', handleEnd);
      if (state.complete) {
        state.complete = true;
        clearTimeout(state.tick);
        reject();
      }
    }
    function handleEnd() {
      client.off('error', handleError);
      if (!state.complete) {
        state.complete = true;
        clearTimeout(state.tick);
        resolve(state.value);
      }
    }

    client.once('error', handleError);
    client.once('end', handleEnd);

    state.tick = setTimeout(() => {
      if (!state.complete) {
        state.complete = true;
        reject();
        client.off('error', handleError);
        client.off('end', handleEnd);
        if (!client.destroyed) {
          client.destroy();
        }
      }
    }, 1000 * 15);
  });
};

export default async ({
  address,
  port = 443,
  count = 30,
}) => {
  if (!net.isIPv4(address)) {
    throw new Error(`\`${address}\` address invalid`);
  }
  if (!(port > 0 && port < 65536)) {
    throw new Error(`\`${port}\` port invalid`);
  }
  let countFail = 0;
  const result = [];
  await (new Array(count))
    .fill(1)
    .reduce(async (acc) => {
      await acc;
      try {
        const time = await calcConnectTime({
          address,
          port,
        });
        result.push(time);
      } catch (error) {
        countFail += 1;
      }
    }, Promise.resolve);
  const countSuccess = result.length;
  if (countSuccess === 0) {
    return {
      address,
      count,
      countFail,
      timeMin: null,
      timeMax: null,
      timePer: null,
    };
  }
  const timePer = result.reduce((acc, cur) => acc + cur, 0) / countSuccess;
  const rate = Math.sqrt(result.map((n) => (n - timePer) ** 2).reduce((acc, cur) => acc + cur, 0) / countSuccess);
  return {
    address,
    rate,
    count,
    countFail,
    timeMin: Math.min(...result),
    timeMax: Math.max(...result),
    timePer,
  };
};
