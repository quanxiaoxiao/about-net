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
