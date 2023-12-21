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
  ...other
}) => createConnector(
  {
    onConnect,
    onData,
    onClose,
    onDrain,
    onError,
  },
  () => tls.connect({
    host: hostname,
    port,
    secureContext: tls.createSecureContext({
      secureProtocol: 'TLSv1_2_method',
    }),
    ...other,
  }),
);
