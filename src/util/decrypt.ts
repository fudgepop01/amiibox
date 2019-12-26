import * as maboii from 'maboii';
import * as fs from 'fs';

const main = (file: string | Buffer, keyPath: string) => {
  const keys = maboii.loadMasterKeys([...fs.readFileSync(keyPath)]);
  if (file instanceof Buffer) {
    const unpacked = maboii.unpack(keys, [...file]);
    console.log('derp');
    console.log(Buffer.from(unpacked.unpacked));
    return Buffer.from(unpacked.unpacked);
  } else {
    console.log('derp2');
    const unpacked = maboii.unpack(keys, [...fs.readFileSync(`enc_custom/${file}`)]);
    fs.writeFileSync(`dec_custom/${file}`, Buffer.from(unpacked.unpacked));
  }
}

export default main;