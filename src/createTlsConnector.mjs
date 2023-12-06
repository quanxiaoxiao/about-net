import tls from 'node:tls';
import createConnector from './createConnector.mjs';

export default ({
  hostname,
  port,
  onConnect,
  onData,
  onClose,
  onDrain,
  onError,
  servername,
  ...other
}) => createConnector({
  onConnect,
  onData,
  onClose,
  onDrain,
  onError,
}, () => tls.connect({
  host: hostname,
  servername,
  port,
  ...other,
}));
