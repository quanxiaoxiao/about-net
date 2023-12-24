import createConnector from './createConnector.mjs';

export default async (
  socketSource,
  {
    sourceBufList = [],
    getConnect,
    onClose,
    onError,
    onConnect,
  },
) => {
  if (socketSource.readyState !== 'open' || socketSource.destroyed) {
    return;
  }

  const state = {
    source: null,
    dest: null,
    isActive: true,
    sourceBufList,
    tick: null,
  };

  if (!socketSource.isPaused()) {
    socketSource.pause();
  }

  const handleError = (error) => {
    state.source();
    if (state.dest) {
      state.dest();
    }
    if (state.isActive) {
      state.isActive = false;
      if (onError) {
        onError(error);
      } else {
        console.error(error);
      }
    }
  };

  state.source = createConnector({
    onData: (chunk) => {
      if (state.isActive) {
        if (!state.dest) {
          state.source.pause();
          state.sourceBufList.push(chunk);
        } else {
          try {
            const ret = state.dest.write(chunk);
            if (!ret) {
              state.source.pause();
            }
          } catch (error) {
            handleError(error);
          }
        }
      } else {
        state.source();
      }
    },
    onDrain: () => {
      if (state.dest) {
        state.dest.resume();
      }
    },
    onClose: () => {
      if (state.isActive) {
        state.isActive = false;
        if (state.dest) {
          state.dest.end();
          if (onClose) {
            onClose();
          }
        } else if (onError) {
          onError(new Error('source socket close'));
        }
      }
    },
    onError: handleError,
  }, () => socketSource);

  if (state.source && state.isActive) {
    state.dest = createConnector({
      onConnect: () => {
        if (state.isActive) {
          clearTimeout(state.tick);
          state.source.resume();
          if (onConnect) {
            onConnect();
          }
        } else {
          state.dest();
        }
      },
      onClose: () => {
        if (state.isActive) {
          state.isActive = false;
          state.source.end();
          if (onClose) {
            onClose();
          }
        }
      },
      onError: handleError,
      onData: (chunk) => {
        if (state.isActive) {
          try {
            const ret = state.source.write(chunk);
            if (!ret) {
              state.dest.pause();
            }
          } catch (error) {
            handleError(error);
          }
        } else {
          state.dest();
        }
      },
      onDrain: () => {
        state.source.resume();
      },
    }, getConnect);

    if (!state.dest) {
      handleError(new Error('create connect fail'));
    } else {
      while (state.isActive
       && state.sourceBufList.length > 0) {
        try {
          const chunk = state.sourceBufList.shift();
          state.dest.write(chunk);
        } catch (error) {
          handleError(error);
        }
      }
      if (state.isActive) {
        state.tick = setTimeout(() => {
          if (state.tick) {
            handleError(new Error('connect dest timeout'));
          }
        }, 1000 * 10);
      }
    }
  }
};
