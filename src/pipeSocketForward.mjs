import createConnector from './createConnector.mjs';
import {
  SocketPipeTimeoutError,
  SocketPipeError,
} from './errors.mjs';

export default async (
  socketSource,
  {
    getConnect,
    sourceBufList = [],
    onConnect,
    onIncoming,
    onOutgoing,
    onClose,
    onError,
  },
) => {
  const controller = new AbortController();

  const state = {
    source: null,
    dest: null,
    sourceBufList,
    tick: null,
  };

  function emitError(error) {
    if (!controller.signal.aborted) {
      if (onError) {
        onError(error);
      }
      controller.abort();
      if (state.tick != null) {
        clearTimeout(state.tick);
      }
    }
  }

  state.source = createConnector(
    {
      onData: (chunk) => {
        if (!controller.signal.aborted) {
          if (onOutgoing) {
            onOutgoing(chunk);
          }
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
              emitError(error);
            }
          }
        } else {
          state.source();
        }
      },
      onDrain: () => {
        if (!controller.signal.aborted && state.dest) {
          state.dest.resume();
        }
      },
      onClose: () => {
        if (!controller.signal.aborted) {
          if (onClose) {
            onClose();
          }
          if (state.dest) {
            state.dest.end();
          }
          controller.abort();
        }
      },
      onError: emitError,
    },
    () => socketSource,
    controller.signal,
  );

  if (state.source && !controller.signal.aborted) {
    state.dest = createConnector(
      {
        onConnect: () => {
          if (!controller.signal.aborted) {
            clearTimeout(state.tick);
            state.tick = null;
            state.source.resume();
            if (onConnect) {
              onConnect();
            }
          } else {
            state.dest();
          }
        },
        onClose: () => {
          if (!controller.signal.aborted) {
            state.source.end();
            if (onClose) {
              onClose();
            }
            controller.abort();
          }
        },
        onError: emitError,
        onData: (chunk) => {
          if (!controller.signal.aborted) {
            if (onIncoming) {
              onIncoming(chunk);
            }
            try {
              const ret = state.source.write(chunk);
              if (!ret) {
                state.dest.pause();
              }
            } catch (error) {
              emitError(error);
            }
          } else {
            state.dest();
          }
        },
        onDrain: () => {
          if (!controller.signal.aborted) {
            state.source.resume();
          }
        },
      },
      getConnect,
      controller.signal,
    );

    if (!state.dest) {
      emitError(new SocketPipeError());
    } else {
      while (!controller.signal.aborted
       && state.sourceBufList.length > 0) {
        try {
          const chunk = state.sourceBufList.shift();
          if (chunk && chunk.length > 0) {
            state.dest.write(chunk);
          }
        } catch (error) {
          emitError(error);
        }
      }
      if (!controller.signal.aborted) {
        state.tick = setTimeout(() => {
          if (state.tick) {
            state.tick = null;
            emitError(new SocketPipeTimeoutError());
          }
        }, 1000 * 55);
      }
    }
  }
};
