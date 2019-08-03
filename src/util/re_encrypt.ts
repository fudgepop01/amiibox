import * as maboii from 'maboii';
import * as fs from 'fs';

const keys = maboii.loadMasterKeys([...fs.readFileSync(__dirname + "/keys/key_retail.bin")]);

const main = (buf: Buffer) => {
  const packed = maboii.pack(keys, [...(buf)]);
  return Buffer.from(packed);
}

export default main;