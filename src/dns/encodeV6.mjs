import encode from './encode.mjs';
import { RECORD_TYPE_AAAA } from './recordTypes.mjs';

export default ({
  hostname,
  identification = 0,
}) => encode({
  hostname,
  identification,
  recordType: RECORD_TYPE_AAAA,
});
