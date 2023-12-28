import tls from 'node:tls';
import net from 'node:net';
/* eslint no-use-before-define: 0 */

/**
 * @param {Object} options
 * @param {() => void | null} options.onConnect
 * @param {(a: Buffer) => void | boolean} options.onData
 * @param {Function} [options.onDrain]
 * @param {Function} [options.onClose]
 * @param {Function} [options.onError]
 * @param {() => import('node:tls').TLSSocket | import('node:net').Socket} getConnect
 */
const createConnector = (
  options,
  getConnect,
) => {
  const {
    onConnect,
    onData,
    onDrain,
    onClose,
    onError,
  } = options;

  const state = {
    isConnect: false,
    isActive: true,
    /** @type {Array<Buffer>} */
    outgoingBufList: [],
  };

  const socket = getConnect();

  if (!(socket instanceof tls.TLSSocket) && !(socket instanceof net.Socket)) {
    if (onError) {
      onError(new Error('connect socket invalid'));
    } else {
      console.error('connect socket invalid');
    }
    return null;
  }

  const destroy = () => {
    if (!socket.destroyed) {
      socket.destroy();
    }
  };

  /**
   * @param {Error} error
   */
  function handleError(error) {
    if (state.isActive) {
      state.isActive = false;
      if (onError) {
        onError(error);
      } else {
        console.error(error);
      }
    }
  }

  socket.once('error', handleError);

  if (!state.isActive) {
    return null;
  }

  if (socket.readyState === 'opening') {
    socket.once('connect', handleConnect);
  } else if (socket.readyState === 'open') {
    handleConnect();
  } else {
    state.isActive = false;
    destroy();
    if (onError) {
      onError(new Error(`unable handle readyState ${socket.readyState}`));
    } else {
      console.error(`unable handle readyState ${socket.readyState}`);
    }
    return null;
  }

  function handleDrain() {
    if (state.isActive) {
      if (onDrain) {
        onDrain();
      }
    } else {
      socket.off('drain', handleDrain);
    }
  }

  function handleConnect() {
    if (state.isActive) {
      state.isConnect = true;
      socket.setTimeout(1000 * 60);
      socket.once('close', handleClose);
      socket.once('timeout', handleTimeout);
      socket.on('drain', handleDrain);
      while (state.isActive
        && state.outgoingBufList.length > 0
        && socket.writable
      ) {
        const chunk = state.outgoingBufList.shift();
        if (chunk) {
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
    } else {
      destroy();
    }
  }

  function handleClose() {
    state.isConnect = false;
    if (state.isActive) {
      state.isActive = false;
      if (onClose) {
        onClose();
      }
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
        state.isActive = false;
        state.isConnect = false;
        socket.off('data', handleData);
        destroy();
      }
    } else {
      socket.off('data', handleData);
      destroy();
    }
  }

  const connector = () => {
    if (state.isActive) {
      state.isActive = false;
      if (state.isConnect) {
        state.isConnect = false;
        socket.off('data', handleData);
        socket.off('close', handleClose);
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
    if (!state.isActive) {
      throw new Error('unable send chunk, socket already close');
    }
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
    if (!state.isActive) {
      throw new Error('socket already close');
    }
    if (!state.isConnect) {
      connector();
    } else {
      socket.off('close', handleClose);
      socket.off('data', handleData);
      socket.off('drain', handleDrain);
      state.isActive = false;
      if (chunk && chunk.length > 0) {
        socket.end(chunk);
      } else {
        socket.end();
      }
    }
  };

  connector.getState = () => state;

  return connector;
};

export default createConnector;
