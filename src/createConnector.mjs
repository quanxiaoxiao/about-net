/* eslint no-use-before-define: 0 */
import tls from 'node:tls';
import net from 'node:net';
import assert from 'node:assert';
import {
  NotIsSocketError,
  SocketUnableOperateError,
  SocketConnectError,
} from './errors.mjs';

// net.Socket.CONNECTING -> net.Socket.OPEN -> net.Socket.CLOSED

/**
 * @param {{
 *   onConnect?: Function,
 *   onData: (a: Buffer) => void | boolean,
 *   onClose?: Function,
 *   onError?: Function,
 *   onDrain?: Function,
 * }} options
 * @param {() => import('node:tls').TLSSocket | import('node:net').Socket} getConnect
 */
const createConnector = (
  options,
  getConnect,
  signal,
) => {
  if (signal && signal.aborted) {
    return null;
  }

  const {
    onConnect,
    onData,
    timeout = 1000 * 60,
    onDrain,
    onClose,
    onError,
  } = options;

  const socket = getConnect();

  const state = {
    isConnect: false,
    isActive: true,
    isBindSignal: false,
    /** @type {Array<Buffer>} */
    outgoingBufList: [],
  };

  /**
   * @param {Error|string} error
   */
  function emitError(error) {
    const err = typeof error === 'string' ? new Error(error) : error;
    if (onError) {
      onError(err);
    } else {
      console.error(err);
    }
  }

  if (!(socket instanceof tls.TLSSocket) && !(socket instanceof net.Socket)) {
    emitError(new NotIsSocketError());
    return null;
  }

  if (socket.destroyed
    || !socket.writable
    || !socket.readable
  ) {
    emitError(new SocketUnableOperateError());
    return null;
  }

  function destroy() {
    if (!socket.destroyed) {
      socket.destroy();
    }
  }

  /**
   * @param {Error} error
   */
  function handleError(error) {
    if (close()) {
      emitError(error);
    }
  }

  socket.once('error', handleError);

  if (!state.isActive) {
    return null;
  }

  if (socket.connecting) {
    socket.once('connect', handleConnect);
  } else {
    handleConnect();
  }

  function handleDrain() {
    assert(state.isActive);
    if (onDrain) {
      onDrain();
    }
  }

  function handleConnect() {
    if (state.isActive) {
      if (!socket.remoteAddress) {
        close();
        emitError(new SocketConnectError());
        destroy();
      } else {
        state.isConnect = true;
        socket.once('close', handleClose);
        if (timeout != null) {
          socket.setTimeout(timeout);
          socket.once('timeout', handleTimeout);
        }
        socket.on('drain', handleDrain);
        while (state.isActive
          && state.outgoingBufList.length > 0
          && socket.writable
        ) {
          const chunk = state.outgoingBufList.shift();
          if (chunk && chunk.length > 0) {
            socket.write(chunk);
          }
        }
        process.nextTick(() => {
          if (state.isActive) {
            if (onConnect) {
              onConnect();
            }
            process.nextTick(() => {
              if (state.isActive) {
                socket.on('data', handleData);
              }
            });
          }
        });
      }
    } else {
      destroy();
    }
  }

  function handleClose() {
    state.isConnect = false;
    if (close() && onClose) {
      onClose();
    }
  }

  function handleTimeout() {
    destroy();
  }

  function pause() {
    if (state.isConnect
      && state.isActive
      && !socket.isPaused()) {
      socket.pause();
    }
  }

  function resume() {
    if (state.isConnect
      && state.isActive
      && socket.isPaused()) {
      socket.resume();
    }
  }

  function close() {
    if (state.isActive) {
      state.isActive = false;
      if (signal
        && !signal.aborted
        && state.isBindSignal
      ) {
        signal.removeEventListener('abort', handleAbortOnSignal);
      }

      return true;
    }
    return false;
  }

  /**
   * @param {Buffer} chunk
   */
  function handleData(chunk) {
    if (state.isActive) {
      try {
        if (onData(chunk) === false) {
          pause();
        }
      } catch (error) {
        socket.off('data', handleData);
        close();
        destroy();
      }
    } else {
      socket.off('data', handleData);
      destroy();
    }
  }

  const connector = () => {
    if (close()) {
      if (state.isConnect) {
        state.isConnect = false;
        socket.off('data', handleData);
        socket.off('close', handleClose);
        socket.off('drain', handleDrain);
        if (timeout != null) {
          socket.off('timeout', handleTimeout);
        }
      }
      if (socket.connecting) {
        socket.off('connect', handleConnect);
      }
      destroy();
    }
  };

  connector.pause = pause;
  connector.resume = resume;

  /**
   * @param {Buffer} chunk
   * @return {boolean}
   */
  connector.write = (chunk) => {
    assert(state.isActive);
    if (!state.isConnect) {
      state.outgoingBufList.push(chunk);
      return false;
    }
    if (socket.writable) {
      return socket.write(chunk);
    }
    return false;
  };

  /**
   * @param {Buffer|null} chunk
   */
  connector.end = (chunk) => {
    assert(state.isActive);
    if (!state.isConnect) {
      connector();
    } else {
      socket.off('close', handleClose);
      socket.off('data', handleData);
      socket.off('drain', handleDrain);
      if (timeout != null) {
        socket.off('timeout', handleTimeout);
      }
      close();
      if (chunk && chunk.length > 0) {
        socket.end(chunk);
      } else {
        socket.end();
      }
    }
  };

  connector.getState = () => state;

  function handleAbortOnSignal() {
    connector();
  }

  if (signal) {
    state.isBindSignal = true;
    signal.addEventListener(
      'abort',
      handleAbortOnSignal,
      { once: true },
    );
  }

  return connector;
};

export default createConnector;
