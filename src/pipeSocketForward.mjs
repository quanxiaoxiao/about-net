import createConnector from './createConnector.mjs';

export default async (
  socketSource,
  {
    getConnect,
    sourceBufList = [],
    onClose,
    onError,
    onConnect,
  },
) => {
  const controller = new AbortController();
  const state = {
    source: null,
    dest: null,
    sourceBufList,
    tick: null,
  };

  state.source = createConnector(
    {
      onData: (chunk) => {
        if (!controller.signal.aborted) {
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
              if (!controller.signal.aborted) {
                if (onError) {
                  onError(error);
                }
                controller.abort();
              }
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
      onError: (error) => {
        if (!controller.signal.aborted) {
          if (onError) {
            onError(error);
          }
          controller.abort();
        }
      },
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
        onError: (error) => {
          if (!controller.signal.aborted) {
            if (onError) {
              onError(error);
            }
            controller.abort();
          }
        },
        onData: (chunk) => {
          if (!controller.signal.aborted) {
            try {
              const ret = state.source.write(chunk);
              if (!ret) {
                state.dest.pause();
              }
            } catch (error) {
              if (!controller.signal.aborted) {
                if (onError) {
                  onError(error);
                }
                controller.abort();
              }
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
      if (!controller.signal.aborted) {
        if (onError) {
          onError(new Error('create remote connector fail'));
        }
        controller.abort();
      }
    } else {
      while (!controller.signal.aborted
       && state.sourceBufList.length > 0) {
        try {
          const chunk = state.sourceBufList.shift();
          if (chunk && chunk.length > 0) {
            state.dest.write(chunk);
          }
        } catch (error) {
          if (!controller.signal.aborted) {
            if (onError) {
              onError(error);
            }
            controller.abort();
          }
        }
      }
      if (!controller.signal.aborted) {
        state.tick = setTimeout(() => {
          if (state.tick) {
            state.tick = null;
            if (!controller.signal.aborted) {
              if (onError) {
                onError(new Error('connect dest timeout'));
              }
            }
          }
        }, 1000 * 10);
      }
    }
  }
};
