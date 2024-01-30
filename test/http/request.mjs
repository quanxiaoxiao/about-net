import net from 'node:net';
import { PassThrough } from 'node:stream';
import test from 'ava'; // eslint-disable-line
import encodeHttp from '../../src/http/encodeHttp.mjs';
import { decodeHttpRequest } from '../../src/http/decodeHttp.mjs';
import {
  HttpEncodeError,
  SocketConnectError,
  SocketCloseError,
} from '../../src/errors.mjs';
import request from '../../src/http/request.mjs';

const _getPort = () => {
  let _port = 5350;
  return () => {
    const port = _port;
    _port += 1;
    return port;
  };
};

const getPort = _getPort();

const waitFor = async (t = 100) => {
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, t);
  });
};

test('socket unable connect 1', async (t) => {
  try {
    await request({
      path: '/aaa',
    }, () => {
      const socket = net.Socket();
      return socket;
    });
    t.fail();
  } catch (error) {
    t.true(error instanceof SocketConnectError);
  }
  await waitFor();
});

test('socket unable connect 2', async (t) => {
  try {
    await request({
      path: '/aaa',
    }, () => {
      const socket = net.Socket();
      socket.connect({
        host: '127.0.0.1',
        port: 9989,
      });
      return socket;
    });
    t.fail();
  } catch (error) {
    t.true(error instanceof SocketConnectError);
  }
  await waitFor();
});

test('error server close error 1', async (t) => {
  t.plan(2);
  const port = getPort();
  const server = net.createServer((socket) => {
    socket.on('data', (chunk) => {
      t.is(chunk.toString(), encodeHttp({
        path: '/',
        method: 'GET',
        body: null,
      }).toString());
    });
    setTimeout(() => {
      socket.end();
    }, 100);
  });
  server.listen(port);
  try {
    await request({}, () => {
      const socket = net.Socket();
      socket.connect({
        host: '127.0.0.1',
        port,
      });
      return socket;
    });
    t.fail();
  } catch (error) {
    t.true(error instanceof SocketCloseError);
  }
  await waitFor();
  server.close();
});

test('server response error 1', async (t) => {
  t.plan(1);
  const port = getPort();
  const server = net.createServer((socket) => {
    socket.on('data', () => {
    });
    socket.write('HTTP/1.1 200\r\nContent-Length: 3\r\n\r\nab');
    setTimeout(() => {
      socket.destroy();
    }, 100);
  });
  server.listen(port);
  try {
    await request({}, () => {
      const socket = net.Socket();
      socket.connect({
        host: '127.0.0.1',
        port,
      });
      return socket;
    });
    t.fail();
  } catch (error) {
    t.pass();
  }
  await waitFor(500);
  server.close();
});

test('onConnect trigger error', async (t) => {
  t.plan(1);
  const port = getPort();
  const server = net.createServer((socket) => {
    socket.on('data', () => {
      t.fail();
    });
  });
  server.listen(port);
  try {
    await request({
      method: 'GET',
      path: '/aaa',
      onRequest: () => {
        throw new Error('xxx');
      },
    }, () => {
      const socket = net.Socket();
      socket.connect({
        host: '127.0.0.1',
        port,
      });
      return socket;
    });
    t.fail();
  } catch (error) {
    t.is(error.message, 'xxx');
  }
  await waitFor(500);
  server.close();
});

test('trigger onRequest error 1', async (t) => {
  t.plan(2);
  const port = getPort();
  const server = net.createServer((socket) => {
    socket.on('data', () => {
      t.fail();
      socket.write('HTTP/1.1 200\r\nContent-Length: 3\r\n\r\nabc');
    });
  });
  server.listen(port);
  try {
    const ret = await request({
      path: '/',
      onRequest: async () => {
        t.pass();
        await waitFor(100);
        throw new Error('aaa');
      },
    }, () => {
      const socket = net.Socket();
      socket.connect({
        host: '127.0.0.1',
        port,
      });
      return socket;
    });
    console.log(ret);
    t.fail();
  } catch (error) {
    t.is(error.message, 'aaa');
  }
  await waitFor(500);
  server.close();
});

test('trigger onRequest error 2', async (t) => {
  t.plan(2);
  const port = getPort();
  const server = net.createServer(async (socket) => {
    socket.on('data', () => {
      t.fail();
    });
    await waitFor(100);
    socket.destroy();
  });
  server.listen(port);
  try {
    await request({
      path: '/',
      onOutgoing: () => {
        t.fail();
      },
      onRequest: async () => {
        t.pass();
        await waitFor(200);
      },
    }, () => {
      const socket = net.Socket();
      socket.connect({
        host: '127.0.0.1',
        port,
      });
      return socket;
    });
    t.fail();
  } catch (error) {
    t.pass();
  }
  await waitFor(500);
  server.close();
});

test('trigger onRequest error 3', async (t) => {
  t.plan(3);
  const port = getPort();
  const server = net.createServer(async (socket) => {
    socket.on('close', () => {
      t.pass();
    });
    socket.on('data', () => {
      t.fail();
    });
  });
  server.listen(port);
  try {
    await request({
      path: '/',
      onOutgoing: () => {
        t.fail();
      },
      onRequest: async (opt) => {
        t.is(opt.body, null);
        opt.body = 11;
      },
    }, () => {
      const socket = net.Socket();
      socket.connect({
        host: '127.0.0.1',
        port,
      });
      return socket;
    });
    t.fail();
  } catch (error) {
    t.true(error instanceof HttpEncodeError);
  }
  await waitFor(500);
  server.close();
});

test('trigger onResponse error 1', async (t) => {
  t.plan(3);
  const port = getPort();
  const server = net.createServer(async (socket) => {
    socket.on('close', () => {
      t.pass();
    });
    socket.on('data', () => {
      socket.write(encodeHttp({
        statusCode: 400,
        body: 'ok',
      }));
    });
  });
  server.listen(port);
  try {
    await request({
      path: '/',
      onResponse: async (ret) => {
        t.is(ret.statusCode, 400);
        await waitFor(100);
        throw new Error('bbbb');
      },
      onBody: () => {
        t.fail();
      },
    }, () => {
      const socket = net.Socket();
      socket.connect({
        host: '127.0.0.1',
        port,
      });
      return socket;
    });
    t.fail();
  } catch (error) {
    t.is(error.message, 'bbbb');
  }
  await waitFor(500);
  server.close();
});

test('body read stream error close', async (t) => {
  t.plan(4);
  const port = getPort();
  let i = 0;
  const server = net.createServer((socket) => {
    const decode = decodeHttpRequest({
      onBody: (chunk) => {
        if (i === 0) {
          t.is(chunk.toString(), 'aaa');
        } else if (i === 1) {
          t.is(chunk.toString(), 'bbb');
        } else {
          t.fail();
        }
        i++;
      },
      onEnd: () => {
        t.fail();
      },
    });
    socket.on('data', (chunk) => {
      decode(chunk);
    });
    socket.on('close', () => {
      t.pass();
    });
  });
  server.listen(port);
  const pass = new PassThrough();
  setTimeout(() => {
    pass.write('aaa');
  }, 200);
  setTimeout(() => {
    pass.write('bbb');
  }, 300);
  setTimeout(() => {
    pass.destroy();
  }, 400);
  try {
    await request({
      path: '/aaa',
      method: 'POST',
      body: pass,
    }, () => {
      const socket = net.Socket();
      socket.connect({
        host: '127.0.0.1',
        port,
      });
      return socket;
    });
    t.fail();
  } catch (error) {
    t.pass();
  }
  await waitFor(3000);
  server.close();
});

test('request fail body read stream close 1', async (t) => {
  const pass = new PassThrough();
  t.false(pass.destroyed);
  try {
    await request({
      path: '/aaa',
      method: 'POST',
      body: pass,
    }, () => {
      const socket = net.Socket();
      socket.connect({
        host: '127.0.0.256',
        port: 5544,
      });
      return socket;
    });
    t.fail();
  } catch (error) {
    t.pass();
  }
  t.true(pass.destroyed);
});

test('request fail body read stream close 3', async (t) => {
  t.plan(2);
  const port = getPort();
  const server = net.createServer(() => {
    t.pass();
  });
  server.listen(port);
  const pass = new PassThrough();
  pass.destroy();
  try {
    await request({
      path: '/aaa',
      method: 'POST',
      body: pass,
    }, () => {
      const socket = net.Socket();
      socket.connect({
        host: '127.0.0.1',
        port,
      });
      return socket;
    });
    t.fail();
  } catch (error) {
    t.pass();
  }
  await waitFor();
  server.close();
});

test('request fail body read stream close 2', async (t) => {
  const port = getPort();
  t.plan(4);
  const server = net.createServer((socket) => {
    t.pass();
    socket.destroy();
  });
  server.listen(port);
  const pass = new PassThrough();
  t.false(pass.destroyed);
  try {
    await request({
      path: '/aaa',
      method: 'POST',
      body: pass,
    }, () => {
      const socket = net.Socket();
      socket.connect({
        host: '127.0.0.1',
        port,
      });
      return socket;
    });
    t.fail();
  } catch (error) {
    t.pass();
  }
  t.true(pass.destroyed);
  await waitFor();
  server.close();
});

test('body read stream socket error close', async (t) => {
  t.plan(4);
  const port = getPort();
  let i = 0;
  const server = net.createServer((socket) => {
    const decode = decodeHttpRequest({
      onBody: (chunk) => {
        if (i === 0) {
          t.is(chunk.toString(), 'aaa');
        } else if (i === 1) {
          t.is(chunk.toString(), 'bbb');
          socket.destroy();
        } else {
          t.fail();
        }
        i++;
      },
      onEnd: () => {
        t.fail();
      },
    });
    socket.on('data', (chunk) => {
      decode(chunk);
    });
  });
  server.listen(port);
  const pass = new PassThrough();
  setTimeout(() => {
    pass.write('aaa');
  }, 200);
  setTimeout(() => {
    pass.write('bbb');
  }, 300);
  setTimeout(() => {
    t.true(pass.destroyed);
  }, 400);
  try {
    await request({
      path: '/aaa',
      method: 'POST',
      body: pass,
    }, () => {
      const socket = net.Socket();
      socket.connect({
        host: '127.0.0.1',
        port,
      });
      return socket;
    });
    t.fail();
  } catch (error) {
    t.pass();
  }
  await waitFor(3000);
  server.close();
});

test('1', async (t) => {
  t.plan(5);
  const port = getPort();
  const server = net.createServer((socket) => {
    socket.on('data', (chunk) => {
      t.is(chunk.toString(), encodeHttp({
        path: '/',
        method: 'GET',
        body: null,
      }).toString());
    });
    socket.on('close', () => {
      t.pass();
    });
    setTimeout(() => {
      socket.write(encodeHttp({
        statusCode: 200,
        body: 'ok',
      }));
    }, 100);
  });
  server.listen(port);
  const ret = await request({
    onOutgoing: (chunk) => {
      t.is(chunk.toString(), 'GET / HTTP/1.1\r\nContent-Length: 0\r\n\r\n');
    },
    onIncoming: (chunk) => {
      t.is(chunk.toString(), 'HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\nok');
    },
  }, () => {
    const socket = net.Socket();
    socket.connect({
      host: '127.0.0.1',
      port,
    });
    return socket;
  });
  t.is(ret.body.toString(), 'ok');
  await waitFor();
  server.close();
});

test('2', async (t) => {
  t.plan(1);
  const port = getPort();
  const server = net.createServer((socket) => {
    socket.on('data', () => {
    });
    const encode = encodeHttp({
      statusCode: 200,
    });
    setTimeout(() => {
      socket.write(encode('12'));
      setTimeout(() => {
        socket.write(encode('34'));
        socket.write(encode());
      }, 100);
    }, 100);
  });
  server.listen(port);
  const ret = await request({}, () => {
    const socket = net.Socket();
    socket.connect({
      host: '127.0.0.1',
      port,
    });
    return socket;
  });
  t.is(ret.body.toString(), '1234');
  await waitFor(500);
  server.close();
});

test('3', async (t) => {
  t.plan(1);
  const port = getPort();
  const server = net.createServer((socket) => {
    socket.on('data', () => {
    });
    socket.write('HTTP/1.1 200\r\nContent-Length: 3\r\n\r\nabcdefg');
  });
  server.listen(port);
  const ret = await request({}, () => {
    const socket = net.Socket();
    socket.connect({
      host: '127.0.0.1',
      port,
    });
    return socket;
  });
  t.is(ret.body.toString(), 'abc');
  await waitFor(500);
  server.close();
});

test('4', async (t) => {
  t.plan(1);
  const port = getPort();
  const server = net.createServer((socket) => {
    socket.on('data', () => {
    });
    socket.end('HTTP/1.1 200\r\nContent-Length: 3\r\n\r\nabcdefg');
  });
  server.listen(port);
  const ret = await request({}, () => {
    const socket = net.Socket();
    socket.connect({
      host: '127.0.0.1',
      port,
    });
    return socket;
  });
  t.is(ret.body.toString(), 'abc');
  await waitFor(500);
  server.close();
});

test('response onBody error 1', async (t) => {
  t.plan(5);
  const port = getPort();
  const server = net.createServer((socket) => {
    socket.on('close', () => {
      t.pass();
    });
    socket.on('data', () => {
      socket.write('HTTP/1.1 200\r\nContent-Length: 6\r\n\r\nab');
      setTimeout(() => {
        socket.write('cd');
      }, 100);
      setTimeout(() => {
        t.true(socket.destroyed);
      }, 120);
    });
  });
  server.listen(port);
  let i = 0;
  try {
    await request({
      onBody: (chunk) => {
        if (i === 0) {
          t.is(chunk.toString(), 'ab');
        } else if (i === 1) {
          t.is(chunk.toString(), 'cd');
          throw new Error();
        } else {
          t.fail();
        }
        i += 1;
      },
    }, () => {
      const socket = net.Socket();
      socket.connect({
        host: '127.0.0.1',
        port,
      });
      return socket;
    });
    t.fail();
  } catch (error) {
    t.pass();
  }
  await waitFor(1000);
  server.close();
});

test('onBody 1', async (t) => {
  t.plan(2);
  const port = getPort();
  const server = net.createServer((socket) => {
    socket.on('data', () => {
      socket.end('HTTP/1.1 200\r\nContent-Length: 3\r\n\r\nabcdefg');
    });
  });
  server.listen(port);
  const ret = await request({
    onBody: (chunk) => {
      t.is(chunk.toString(), 'abc');
    },
  }, () => {
    const socket = net.Socket();
    socket.connect({
      host: '127.0.0.1',
      port,
    });
    return socket;
  });
  t.is(ret.body.length, 0);
  await waitFor(500);
  server.close();
});

test('read stream 1', async (t) => {
  t.plan(6);
  const port = getPort();
  let i = 0;
  const server = net.createServer((socket) => {
    const decode = decodeHttpRequest({
      onBody: (chunk) => {
        if (i === 0) {
          t.is(chunk.toString(), 'aaa');
        } else if (i === 1) {
          t.is(chunk.toString(), 'bbb');
        } else {
          t.fail();
        }
        i++;
      },
      onEnd: (ret) => {
        t.is(ret.headers['transfer-encoding'], 'chunked');
        socket.write('HTTP/1.1 200\r\nContent-Length: 3\r\n\r\nabc');
      },
    });
    socket.on('data', (chunk) => {
      decode(chunk);
    });
    socket.on('close', () => {
      t.pass();
    });
  });
  server.listen(port);
  const pass = new PassThrough();
  setTimeout(() => {
    pass.write('aaa');
  }, 200);
  setTimeout(() => {
    pass.write('bbb');
  }, 300);
  setTimeout(() => {
    pass.end();
  }, 400);
  const ret = await request({
    path: '/aaa',
    method: 'POST',
    body: pass,
    onBody: (chunk) => {
      t.is(chunk.toString(), 'abc');
    },
  }, () => {
    const socket = net.Socket();
    socket.connect({
      host: '127.0.0.1',
      port,
    });
    return socket;
  });
  t.is(ret.body.length, 0);
  await waitFor(3000);
  server.close();
});

test('abort 1', async (t) => {
  t.plan(4);
  const port = getPort();
  const server = net.createServer((socket) => {
    socket.on('close', () => {
      t.pass();
    });
    socket.on('data', () => {
      t.pass();
    });
  });
  server.listen(port);
  const controller = new AbortController();
  setTimeout(() => {
    controller.abort();
  }, 100);
  try {
    await request({
      path: '/',
      signal: controller.signal,
      onRequest: () => {
        t.pass();
      },
    }, () => {
      const socket = net.Socket();
      socket.connect({
        host: '127.0.0.1',
        port,
      });
      return socket;
    });
    t.fail();
  } catch (error) {
    t.true(controller.signal.aborted);
  }
  await waitFor(500);
  server.close();
});

test('read stream abort', async (t) => {
  t.plan(4);
  const port = getPort();
  let i = 0;
  const server = net.createServer((socket) => {
    const decode = decodeHttpRequest({
      onBody: (chunk) => {
        if (i === 0) {
          t.is(chunk.toString(), 'aaa');
        } else {
          t.fail();
        }
        i++;
      },
      onEnd: () => {
        t.fail();
      },
    });
    socket.on('data', (chunk) => {
      decode(chunk);
    });
    socket.on('close', () => {
      t.pass();
    });
  });
  server.listen(port);
  const pass = new PassThrough();
  const controller = new AbortController();
  setTimeout(() => {
    pass.write('aaa');
  }, 200);
  setTimeout(() => {
    controller.abort();
    t.true(pass.destroyed);
  }, 300);
  try {
    await request({
      path: '/aaa',
      method: 'POST',
      body: pass,
      signal: controller.signal,
    }, () => {
      const socket = net.Socket();
      socket.connect({
        host: '127.0.0.1',
        port,
      });
      return socket;
    });
    t.fail();
  } catch (error) {
    t.true(controller.signal.aborted);
  }
  await waitFor(3000);
  server.close();
});

test('onBody is stream', async (t) => {
  t.plan(4);
  const port = getPort();
  const server = net.createServer((socket) => {
    const encode = encodeHttp({
      statusCode: 200,
      headers: {},
    });
    socket.on('data', () => {
      setTimeout(() => {
        socket.write(encode('1111'));
      }, 50);
      setTimeout(() => {
        socket.write(encode('222'));
      }, 100);
      setTimeout(() => {
        socket.write(encode('333'));
      }, 150);
      setTimeout(() => {
        socket.write(encode('444'));
      }, 200);
      setTimeout(() => {
        socket.write(encode());
      }, 400);
    });
  });
  let i = 0;
  const onBody = new PassThrough();
  onBody.on('data', (chunk) => {
    if (i === 0) {
      t.is(chunk.toString(), '1111');
    } else if (i === 1) {
      t.is(chunk.toString(), '222');
    } else if (i === 2) {
      t.is(chunk.toString(), '333');
    } else if (i === 3) {
      t.is(chunk.toString(), '444');
    } else {
      t.fail();
    }
    i++;
  });
  server.listen(port);
  await request({
    path: '/',
    onBody,
    body: null,
  }, () => net.connect({
    host: '127.0.0.1',
    port,
  }));
  await waitFor(3000);
  server.close();
});

test('onBody stream close', async (t) => {
  t.plan(3);
  const port = getPort();
  const server = net.createServer((socket) => {
    const encode = encodeHttp({
      statusCode: 200,
      headers: {},
    });
    socket.on('data', () => {
      setTimeout(() => {
        socket.write(encode('1111'));
      }, 50);
      setTimeout(() => {
        socket.write(encode('222'));
      }, 100);
      setTimeout(() => {
        socket.write(encode('333'));
      }, 200);
    });
  });
  let i = 0;
  const onBody = new PassThrough();
  onBody.on('data', (chunk) => {
    if (i === 0) {
      t.is(chunk.toString(), '1111');
    } else if (i === 1) {
      t.is(chunk.toString(), '222');
      onBody.destroy();
    } else {
      t.fail();
    }
    i++;
  });
  server.listen(port);
  try {
    await request({
      path: '/',
      onBody,
      body: null,
    }, () => net.connect({
      host: '127.0.0.1',
      port,
    }));
    t.fail();
  } catch (error) {
    t.pass();
  }
  await waitFor(3000);
  server.close();
});

test('onBody stream backpress', async (t) => {
  const port = getPort();
  const onBody = new PassThrough();
  const server = net.createServer((socket) => {
    socket.on('data', () => {
      socket.write('HTTP/1.1 200\r\nContent-Length: 15\r\n\r\naa');
      setTimeout(() => {
        socket.write('1111');
      }, 50);
      setTimeout(() => {
        socket.write('222');
      }, 100);
      setTimeout(() => {
        socket.write('333');
      }, 200);
      setTimeout(() => {
        socket.write('444');
      }, 250);
    });
  });
  const _write = onBody.write;
  let i = 0;
  onBody.write = (chunk) => {
    _write.call(onBody, chunk);
    if (i === 2) {
      i++;
      setTimeout(() => {
        onBody.emit('drain');
      }, 50);
      return false;
    }
    i++;
    return true;
  };
  server.listen(port);
  const ret = await request({
    path: '/',
    onBody,
    body: null,
  }, () => net.connect({
    host: '127.0.0.1',
    port,
  }));
  t.is(ret.bytesBody, 15);
  await waitFor(3000);
  server.close();
});
