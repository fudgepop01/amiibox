import * as maboii from 'maboii';
import * as fs from 'fs';


const main = (buf: Buffer, keyPath: string) => {
  const keys = maboii.loadMasterKeys([...fs.readFileSync(keyPath)]);
  const packed = maboii.pack(keys, [...(buf)]);
  return Buffer.from(packed);
}

export default main;