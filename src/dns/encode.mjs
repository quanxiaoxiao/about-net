import { OPCODE_QUERY } from './opcodes.mjs';
import { RCODE_NOERROR } from './rcodes.mjs';
import { CLASS_IN } from './classes.mjs';
import encodeHostname from './encodeHostname.mjs';

const QUERY_FLAG = 0;
// const RESPONSE_FLAG = 1 << 15;
const TRUNCATE_FLAG_FALSE = 0;
const AUTHORITATIVE_ANSWER_FALSE = 0;
// const AUTHORITATIVE_ANSWER_TRUE = 1 << 2;
// const TRUNCATE_FLAG_TRUE = 1 << 1;
const RECURSION_DESIRED_TRUE = 1;
// const RECURSION_DESIRED_FALSE = 0;
const RECURSION_AVAILABLE_FALSE = 0;
// const RECURSION_AVAILABLE_TRUE = 1;

export default ({
  hostname,
  identification = 0,
  recordType,
}) => {
  if (identification > 65535 || identification < 0) {
    throw new Error('identification exceed 65535 or small 0');
  }
  const bufList = [];
  const identificationBuf = Buffer.allocUnsafe(2);
  const controlFirstBuf = Buffer.allocUnsafe(1);
  const controlSecondBuf = Buffer.allocUnsafe(1);
  const questionCountBuf = Buffer.allocUnsafe(2);
  const answerRecordCountBuf = Buffer.allocUnsafe(2);
  const authorityRecordCountBuf = Buffer.allocUnsafe(2);
  const additionalRecordCountBuf = Buffer.allocUnsafe(2);
  const recordTypeBuf = Buffer.allocUnsafe(2);
  const classBuf = Buffer.allocUnsafe(2);

  identificationBuf.writeUInt16BE(identification);
  let controlFirst = 0;
  let controlSecond = 0;
  controlFirst += QUERY_FLAG;
  controlFirst += (OPCODE_QUERY << 3);
  controlFirst += (AUTHORITATIVE_ANSWER_FALSE << 2);
  controlFirst += (TRUNCATE_FLAG_FALSE << 1);
  controlFirst += RECURSION_DESIRED_TRUE;
  controlFirstBuf.writeUInt8(controlFirst);

  controlSecond += (RECURSION_AVAILABLE_FALSE << 7);
  controlSecond += RCODE_NOERROR;
  controlSecondBuf.writeUInt8(controlSecond);

  questionCountBuf.writeUInt16BE(1);
  answerRecordCountBuf.writeUInt16BE(0);
  authorityRecordCountBuf.writeUInt16BE(0);
  additionalRecordCountBuf.writeUInt16BE(0);
  recordTypeBuf.writeUInt16BE(recordType);
  classBuf.writeUInt16BE(CLASS_IN);

  bufList.push(identificationBuf);
  bufList.push(controlFirstBuf);
  bufList.push(controlSecondBuf);
  bufList.push(questionCountBuf);
  bufList.push(answerRecordCountBuf);
  bufList.push(authorityRecordCountBuf);
  bufList.push(additionalRecordCountBuf);

  bufList.push(encodeHostname(hostname));
  bufList.push(recordTypeBuf);
  bufList.push(classBuf);

  return Buffer.concat(bufList);
};
