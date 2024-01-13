import tls from 'node:tls';
import net from 'node:net';
import enpack from '../enpack.mjs';
import depack from '../depack.mjs';
import createConnector from '../createConnector.mjs';
import decodeAnswer from './decodeAnswer.mjs';
import encodeV4 from './encodeV4.mjs';
import { RECORD_TYPE_A } from './recordTypes.mjs';

export default (hostname, server, port) => {
  if (net.isIPv4(hostname) || net.isIPv6(hostname)) {
    return [hostname];
  }
  const state = {
    depack: depack(),
    decode: decodeAnswer(),
    complete: false,
    tick: null,
  };

  return new Promise((resolve, reject) => {
    const emitError = (error) => {
      if (!state.complete) {
        state.complete = true;
        if (state.tick != null) {
          clearTimeout(state.tick);
          state.tick = null;
        }
        reject(error);
      }
    };
    const connector = createConnector(
      {
        onError: emitError,
        onClose: () => {
          emitError(new Error('socket close'));
        },
        onData: (chunk) => {
          if (!state.complete) {
            const depackRet = state.depack(chunk);
            if (depackRet) {
              try {
                const { answers } = state.decode(depackRet.payload);
                const addresses = answers.filter((d) => d.recordType === RECORD_TYPE_A);
                if (addresses.length === 0) {
                  throw new Error(`\`${hostname}\` lookup address is empty`);
                }
                if (state.tick != null) {
                  clearTimeout(state.tick);
                  state.tick = null;
                }
                state.complete = true;
                resolve(addresses.map((d) => d.address));
                connector.end();
              } catch (error) {
                emitError(error);
                connector();
              }
            }
          } else {
            connector();
          }
        },
      },
      () => tls.connect({
        host: server || process.env.DNS || '223.5.5.5',
        port: port || 853,
        secureContext: tls.createSecureContext({
          secureProtocol: 'TLSv1_2_method',
        }),
      }),
    );

    connector.write(enpack(encodeV4({
      hostname,
    })));

    state.tick = setTimeout(() => {
      state.tick = null;
      emitError(new Error('request timeout'));
    }, 10 * 1000);
  });
};
