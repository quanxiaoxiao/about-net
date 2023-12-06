/* eslint no-use-before-define: 0 */

const createConnector = ({
  onConnect,
  onData,
  onClose,
  onDrain,
  onError,
}, getConnect) => {
  const state = {
    isConnect: false,
    isActive: true,
    outgoingBufList: [],
  };

  const socket = getConnect();

  const destroy = () => {
    if (!socket.destroyed) {
      socket.destroy();
    }
  };

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
        socket.write(state.outgoingBufList.shift());
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

  const pause = () => {
    if (state.isConnect
      && state.isActive
      && !socket.isPaused()) {
      socket.pause();
    }
  };

  const resume = () => {
    if (state.isConnect
      && state.isActive
      && socket.isPaused()) {
      socket.resume();
    }
  };

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
        socket.off('close', handleClose);
      }
      if (socket.connecting) {
        socket.off('connect', handleConnect);
      }
      destroy();
    }
  };

  connector.pause = () => {
    pause();
  };

  connector.resume = () => {
    resume();
  };

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

  connector.end = () => {
    if (state.isActive) {
      if (state.isConnect) {
        socket.off('close', handleClose);
        socket.off('data', handleData);
        socket.off('drain', handleDrain);
        state.isActive = false;
        socket.end();
      } else {
        connector();
      }
    }
  };

  connector.getState = () => state;

  return connector;
};

export default createConnector;
