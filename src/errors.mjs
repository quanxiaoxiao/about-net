/* eslint max-classes-per-file: 0 */

export class HttpParserError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.message = message || 'HTTP Parser Error';
    this.statusCode = statusCode || null;
  }
}
export class HttpEncodeError extends Error {
  constructor(message) {
    super(message);
    this.message = message || 'HTTP Encode Error';
  }
}

export class ConnectorWriteAfterActiveError extends Error {
  constructor(message) {
    super(message);
    this.message = message || 'Connector Write Error, is not active';
  }
}
