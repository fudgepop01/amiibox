import { NFC } from 'nfc-pcsc';
import { readFileSync } from 'fs';
import ch from 'chalk';

const parseBytes = (name, data, length) => {
	if (!(data instanceof Buffer) && typeof data !== 'string') {
		throw new Error(`${name} must an instance of Buffer or a HEX string.`);
	}
	if (Buffer.isBuffer(data)) {
		if (data.length !== length) {
			throw new Error(`${name} must be ${length} bytes long.`);
		}
		return data;
	}
	if (typeof data === 'string') {
		if (data.length !== length * 2) {
			throw new Error(`${name} must be a ${length * 2} char HEX string.`);
		}
		return Buffer.from(data, 'hex');
	}
	throw new Error(`${name} must an instance of Buffer or a HEX string.`);
};

class CardIO {
  nfc: any;
  reader: any;

  data: Buffer;

  constructor() {
    this.nfc = new NFC;
  }

  init() {
    return new Promise((resolve) => {
      setTimeout(() => {resolve(false)}, 1000);
      this.nfc.on('reader', (reader) => {
        this.reader = reader;
        resolve(true);
      });
    })
  }

  read() {
    return new Promise(async (resolve) => {
      const data = await this.reader.read(0, 540);
      this.data = data;
      resolve(data);
    });
  }

  writeFull(toWrite: Buffer) {
    return new Promise(async (resolve, reject) => {
      const password = parseBytes('Password', 'FFFFFFFF', 4);
      const cmd = Buffer.from([
        0xff, // Class
        0x00, // Direct Transmit (see ACR122U docs)
        0x00, // ...
        0x00, // ...
        0x07, // Length of Direct Transmit payload
        // Payload (7 bytes)
        0xd4, // Data Exchange Command (see PN533 docs)
        0x42, // InCommunicateThru
        0x1b, // PWD_AUTH
        ...password,
      ]);

      const response = await this.reader.transmit(cmd, 7);

      this.reader.logger.debug('pwd_auth response', response);

      if (response.length < 5) {
        console.log('invalid_response_length', `Invalid response length ${response.length}. Expected minimal length was 2 bytes.`)
        process.exit();
      }

      if (response[2] !== 0x00 || response.length < 7) {
        console.log('invalid_password', `Authentication failed. Might be invalid password or unsupported card.`);
        process.exit();
      }

      try {
        console.log('writing data')
        await this.reader.write(0x4, toWrite.slice(0x04 * 4, 0x82 * 4), 4)
        console.log('writing last chunk')
        await this.reader.write(0x82, toWrite.slice(0x82 * 4, 0x88 * 4), 4);
        console.log('writing first chunk')
        console.log('first chunk p4...')
        await this.reader.write(0x3, toWrite.slice(0x03 * 4, 0x04 * 4), 4);
        console.log('first chunk p3...')
        await this.reader.write(0x2, toWrite.slice(0x02 * 4, 0x03 * 4), 4);
        console.log('first chunk p1...')
        await this.reader.write(0x0, toWrite.slice(0x00 * 4, 0x01 * 4), 4);

        console.log('written!');
        resolve();
      }
      catch (e) {
        console.log(e.message);
        reject();
      }
    });
  }

  writeData(toWrite: Buffer, pw) {
    return new Promise(async (resolve, reject) => {
      // console.log(`now processing: ${sourcePath} | pw: ${pw}`);

      const password = parseBytes('Password', pw, 4);
      const cmd = Buffer.from([
        0xff, // Class
        0x00, // Direct Transmit (see ACR122U docs)
        0x00, // ...
        0x00, // ...
        0x07, // Length of Direct Transmit payload
        // Payload (7 bytes)
        0xd4, // Data Exchange Command (see PN533 docs)
        0x42, // InCommunicateThru
        0x1b, // PWD_AUTH
        ...password,
      ]);

      const response = await this.reader.transmit(cmd, 7);

      this.reader.logger.debug('pwd_auth response', response);

      if (response[2] !== 0x00 || response.length < 7) {
        console.error("auth failed");
        this.reader.on('card.off', card => {
          reject();
        });
      }

      console.log(`writing data`)

      for (let chunk = 0x4; chunk <= 0x82; chunk++) {
        if (this.data.slice(chunk * 4, (chunk + 1) * 4).join(',') === toWrite.slice(chunk * 4, (chunk + 1) * 4).join(',')) continue;
        for (let i = 1; i <= 20; i++) {
          try {
            await this.reader.write(chunk, toWrite.slice(chunk * 4, (chunk + 1) * 4), 4)
            break;
          }
          catch (e) {
            if (i === 20) {
              console.error(`failed on 0x${chunk.toString(16)}`);
              reject()
            }
          }
        }
      }

      console.log(ch.bold(ch.cyanBright(`~~ Written! ~~`)));

      this.reader.on('card.off', card => {
        resolve();
      });
    })
  }

  write(toWrite: Buffer, pw) {
    return new Promise(async (resolve, reject) => {
        // console.log(`now processing: ${sourcePath} | pw: ${pw}`);

        const password = parseBytes('Password', pw, 4);
        const cmd = Buffer.from([
          0xff, // Class
          0x00, // Direct Transmit (see ACR122U docs)
          0x00, // ...
          0x00, // ...
          0x07, // Length of Direct Transmit payload
          // Payload (7 bytes)
          0xd4, // Data Exchange Command (see PN533 docs)
          0x42, // InCommunicateThru
          0x1b, // PWD_AUTH
          ...password,
        ]);

        const response = await this.reader.transmit(cmd, 7);

        this.reader.logger.debug('pwd_auth response', response);

        if (response[2] !== 0x00 || response.length < 7) {
          console.error("auth failed");
          this.reader.on('card.off', card => {
            reject();
          });
        }

        console.log(`writing data`)

        for (let chunk = 0x4; chunk <= 0x82; chunk++) {
          if (this.data.slice(chunk * 4, (chunk + 1) * 4).join(',') === toWrite.slice(chunk * 4, (chunk + 1) * 4).join(',')) continue;
          for (let i = 1; i <= 20; i++) {
            try {
              await this.reader.write(chunk, toWrite.slice(chunk * 4, (chunk + 1) * 4), 4)
              break;
            }
            catch (e) {
              if (i === 20) {
                console.error(`failed on 0x${chunk.toString(16)}`);
                reject()
              }
            }
          }
        }

        console.log(ch.bold(ch.cyanBright(`~~ Written! ~~`)));

        this.reader.on('card.off', card => {
          resolve();
        });
    })
  }
}

export default CardIO;