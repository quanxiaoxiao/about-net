import net from 'node:net';
import tls from 'node:tls';
import enpack from '../enpack.mjs';
import depack from '../depack.mjs';
import createTlsConnector from '../createTlsConnector.mjs';
import decodeAnswer from './decodeAnswer.mjs';
import encodeV4 from './encodeV4.mjs';
import { RECORD_TYPE_A } from './recordTypes.mjs';

export default (hostname, server, port) => {
  if (net.isIPv4(hostname)) {
    return [hostname];
  }
  if (net.isIPv6(hostname)) {
    throw new Error(`\`${hostname}\` invalid`);
  }
  const state = {
    depack: depack(),
    decode: decodeAnswer(),
    complete: false,
    tick: null,
  };
  return new Promise((resolve, reject) => {
    const connector = createTlsConnector({
      hostname: server || process.env.DNS || '223.5.5.5',
      port: port || 853,
      onError: (error) => {
        if (!state.complete) {
          state.complete = true;
          clearTimeout(state.tick);
          reject(error);
        }
      },
      onClose: () => {
        if (!state.complete) {
          state.complete = true;
          clearTimeout(state.tick);
          reject(new Error('socket close'));
        }
      },
      onData: (chunk) => {
        if (!state.complete) {
          const depackRet = state.depack(chunk);
          if (depackRet) {
            try {
              const { answers } = state.decode(depackRet.payload);
              const addresses = answers.filter((d) => d.recordType === RECORD_TYPE_A);
              state.complete = true;
              if (addresses.length === 0) {
                reject(new Error(`\`${hostname}\` lookup address is empty`));
              } else {
                resolve(addresses.map((d) => d.address));
              }
              clearTimeout(state.tick);
              connector.end();
            } catch (error) {
              if (!state.complete) {
                state.complete = true;
                clearTimeout(state.tick);
                reject(error);
              }
              connector();
            }
          }
        } else {
          connector();
        }
      },
      secureContext: tls.createSecureContext({
        secureProtocol: 'TLSv1_2_method',
      }),
    });

    connector.write(enpack(encodeV4({
      hostname,
    })));

    state.tick = setTimeout(() => {
      if (!state.complete) {
        state.complete = true;
        connector();
        reject(new Error('request timeout'));
      }
    }, 10 * 1000);
  });
};
