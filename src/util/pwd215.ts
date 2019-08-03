const calcKeyA = (uid: string) => {
  const intVals = []
  const uidSplit = uid.split('');
  for (let i = 0; i < uid.length; i += 2) {
    intVals.push(parseInt(uidSplit[i] + uidSplit[i+1], 16));
  }

  const intKey = [
    (intVals[1] ^ intVals[3] ^ 170) >>> 0,
    (intVals[2] ^ intVals[4] ^ 85) >>> 0,
    (intVals[3] ^ intVals[5] ^ 170) >>> 0,
    (intVals[4] ^ intVals[6] ^ 85) >>> 0
  ]

  //console.log(intKey);
  //console.log(intKey.map(v => v.toString(16).padStart(2, '0')).join(''))
}

const calcKeyARaw = (uid: Buffer) => {
  console.log([...uid.values()].map(v => v.toString(16).padStart(2, '0')));
  const intVals = uid;

  const intKey = [
    (intVals[1] ^ intVals[3] ^ 170) >>> 0,
    (intVals[2] ^ intVals[4] ^ 85) >>> 0,
    (intVals[3] ^ intVals[5] ^ 170) >>> 0,
    (intVals[4] ^ intVals[6] ^ 85) >>> 0
  ]

  // console.log(intKey);
  return intKey.map(v => v.toString(16).padStart(2, '0')).join('');
}

export {
  calcKeyARaw,
  calcKeyA
};