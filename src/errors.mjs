/* eslint max-classes-per-file: 0 */

export class HttpParserError extends Error {
  /**
   * @param {string} [message]
   * @param {number} [statusCode]
   */
  constructor(message, statusCode) {
    super(message);
    this.message = message || 'HTTP Parser Error';
    this.statusCode = statusCode || null;
  }
}

export class HttpEncodeError extends Error {
  /**
   * @param {string} [message]
   */
  constructor(message) {
    super(message);
    this.message = message || 'HTTP Encode Error';
  }
}

export class ConnectorWriteAfterActiveError extends Error {
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
