class CRC32 {
  u0: number[];

  constructor(p0 = 0xEDB88320) {
    // console.log(p0);
    p0 |= 0x80000000;
    p0 >>>= 0;

    let u0 = new Array(0x100).fill(0);
    let i = 1;
    while (i & 0xFF) {
      let t0 = i;
      for (let j = 0; j < 8; j++) {
        let b = (t0 & 0x1) >>> 0;
        t0 = (t0 >>> 0x1) >>> 0;
        if (b) t0 = (t0 ^ p0) >>> 0;
      }
      u0[i] = t0 >>> 0;
      i++;
    }
    this.u0 = u0;
  }

  calc0(s, inXOR = 0xFFFFFFFF, outXOR = 0xFFFFFFFF) {
    let u = this.u0;
    let t = inXOR;
    for (const k of s) {
      t = ((t >>> 0x8) ^ u[(k ^ t) & 0xFF]) >>> 0
    }
    return (t ^ outXOR) >>> 0;
  }
}

const sign = (buffer: Buffer) => {
  let crc32 = new CRC32();
  let t = crc32.calc0(buffer.slice(0xE0, 0xE0 + 0xD4), 0x0);
  let buf = Buffer.alloc(4);
  buf.writeUInt32LE(t, 0);

  buffer.writeUInt32LE(t, 0xDC);
}

export default sign;