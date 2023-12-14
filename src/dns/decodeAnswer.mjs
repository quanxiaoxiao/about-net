import {
  RECORD_TYPE_A,
  RECORD_TYPE_AAAA,
  RECORD_TYPE_CNAME,
} from './recordTypes.mjs';
import decodeHostname from './decodeHostname.mjs';
import decode from './decode.mjs';

const formatHostname = (arr) => {
  let result = '';
  for (let i = 0; i < arr.length; i++) {
    const b = arr[i];
    if (Array.isArray(b)) {
      result = result === '' ? formatHostname(b) : `${result}.${formatHostname(b)}`;
    } else {
      result = result === '' ? b.toString() : `${result}.${b.toString()}`;
    }
  }
  return result;
};

const calcHostnameLength = (arr) => {
  let result = 0;
  const len = arr.length;
  if (len === 0) {
    return 0;
  }
  for (let i = 0; i < len; i++) {
    const b = arr[i];
    if (Array.isArray(b)) {
      result += 2;
    } else {
      result += b.length + 1;
    }
  }
  if (Array.isArray(arr[len - 1])) {
    return result;
  }
  return result + 1;
};

const procedures = [
  {
    size: 2,
    fn: (buf, payload) => {
      payload.identification = buf.readUint16BE(0);
    },
  },
  {
    size: 1,
    fn: (buf, payload) => {
      const n = buf.readUint8(0);
      payload.isReply = (n & 128) !== 0;
      payload.opCode = (n >> 3) & 15;
      payload.isAuthoritativeAnswer = (n & 4) !== 0;
      payload.isTruncate = (n & 2) !== 0;
      payload.isRecursionDesired = (n & 1) !== 0;
    },
  },
  {
    size: 1,
    fn: (buf, payload) => {
      const n = buf.readUint8(0);
      payload.isRecursionAvailable = (n & 128) !== 0;
      payload.responseCode = n & 15;
    },
  },
  {
    size: 2,
    fn: (buf, payload) => {
      payload.questionCount = buf.readUint16BE(0);
    },
  },
  {
    size: 2,
    fn: (buf, payload) => {
      payload.answerRecordCount = buf.readUint16BE(0);
    },
  },
  {
    size: 2,
    fn: (buf, payload) => {
      payload.authorityRecordCount = buf.readUint16BE(0);
    },
  },
  {
    size: 2,
    fn: (buf, payload) => {
      payload.additionalRecordCount = buf.readUint16BE(0);
    },
  },
  (buf, payload, chunk) => {
    const nameList = decodeHostname(buf, chunk);
    payload.query = {
      name: formatHostname(nameList),
    };
    return [calcHostnameLength(nameList), 0];
  },
  {
    size: 2,
    fn: (buf, payload) => {
      payload.query.recordType = buf.readUint16BE(0);
    },
  },
  {
    size: 2,
    fn: (buf, payload) => {
      payload.query.class = buf.readUint16BE(0);
    },
  },
  (buf, payload) => {
    payload.answers = [];
    return [0, 0];
  },
  (buf, payload, chunk) => {
    const nameList = decodeHostname(buf, chunk);
    payload.answers.push({
      name: formatHostname(nameList),
      recordType: null,
      class: null,
      timeToLive: null,
      dataLength: null,
    });
    return [calcHostnameLength(nameList), 0];
  },
  {
    size: 2,
    fn: (buf, payload) => {
      const last = payload.answers[payload.answers.length - 1];
      last.recordType = buf.readUint16BE(0);
    },
  },
  {
    size: 2,
    fn: (buf, payload) => {
      const last = payload.answers[payload.answers.length - 1];
      last.class = buf.readUint16BE(0);
    },
  },
  {
    size: 4,
    fn: (buf, payload) => {
      const last = payload.answers[payload.answers.length - 1];
      last.timeToLive = buf.readUint32BE(0);
    },
  },
  {
    size: 2,
    fn: (buf, payload) => {
      const last = payload.answers[payload.answers.length - 1];
      last.dataLength = buf.readUint16BE(0);
    },
  },
  {
    size: (payload) => {
      const last = payload.answers[payload.answers.length - 1];
      return last.dataLength;
    },
    fn: (buf, payload, chunk) => {
      const last = payload.answers[payload.answers.length - 1];
      switch (last.recordType) {
        case RECORD_TYPE_CNAME: {
          const nameList = decodeHostname(buf.slice(0, last.dataLength), chunk);
          last.cname = nameList.map((b) => b.toString()).join('.');
          break;
        }
        case RECORD_TYPE_A: {
          last.address = [
            buf.readUint8(0),
            buf.readUint8(1),
            buf.readUint8(2),
            buf.readUint8(3),
          ].join('.');
          break;
        }
        case RECORD_TYPE_AAAA: {
          const arr = [];
          const toHex = (i, isPad) => {
            const s = buf.readUint8(i).toString(16);
            if (isPad) {
              return s.padStart(2, '0');
            }
            return s;
          };
          for (let i = 0; i < buf.length;) {
            arr.push(`${toHex(i)}${toHex(i + 1, true)}`
              .replace(/^0+([^0])/, (a, b) => b)
              .replace(/^0+$/, '0'));
            i += 2;
          }
          last.address = arr.join(':');
          break;
        }
        default: break;
      }
    },
  },
  (buf) => {
    if (buf.length === 0 || buf[0] === 0) {
      return [0, 0];
    }
    return [0, -6];
  },
];

export default () => decode(procedures);
