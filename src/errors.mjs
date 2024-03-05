export class ConnectorWriteAfterActiveError extends Error { // eslint-disable-line
  /**
   * @param {string} [message]
   */
  constructor(message) {
    super(message);
    this.message = message || 'Connector Write Error, is not active';
  }
}

export class SocketConnectError extends Error {
  /**
   * @param {string} [message]
   */
  constructor(message) {
    super(message);
    this.message = message || 'Socket Connect Error';
  }
}

export class SocketCloseError extends Error {
  /**
   * @param {string} [message]
   */
  constructor(message) {
    super(message);
    this.message = message || 'Socket Close Error';
  }
}

export class NotIsSocketError extends Error {
  /**
   * @param {string} [message]
   */
  constructor(message) {
    super(message);
    this.message = message || 'Socket Invalid';
  }
}

export class SocketUnableOperateError extends Error {
  /**
   * @param {string} [message]
   */
  constructor(message) {
    super(message);
    this.message = message || 'Socket Unalbe Operate';
  }
}

export class SocketConnectTimeoutError extends Error {
  /**
   * @param {string} [message]
   */
  constructor(message) {
    super(message);
    this.message = message || 'Socket Connect Timeout';
  }
}

export class ConnectorCreateError extends Error {
  /**
   * @param {string} [message]
   */
  constructor(message) {
    super(message);
    this.message = message || 'Create Connector Fail';
  }
}

export class SocketPipeTimeoutError extends Error {
  /**
   * @param {string} [message]
   */
  constructor(message) {
    super(message);
    this.message = message || 'Socket Pipe Timeout';
  }
}

export class SocketPipeError extends Error {
  /**
   * @param {string} [message]
   */
  constructor(message) {
    super(message);
    this.message = message || 'Socket Pipe Error';
  }
}

export class UrlParseError extends Error {
  /**
   * @param {string} [message]
   */
  constructor(message) {
    super(message);
    this.message = message || 'Url Parse Error';
  }
}
