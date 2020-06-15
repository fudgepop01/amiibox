export function floatToBin(value, size, endianness) {
    let exponentBitCount;
    switch (size) {
        case 1:
            exponentBitCount = 4;
            break;
        case 2:
            exponentBitCount = 5;
            break;
        case 4:
            exponentBitCount = 8;
            break;
        case 8:
            exponentBitCount = 11;
            break;
        //case 128: exponentBitCount = 15; break;
        //case 256: exponentBitCount = 19; break;
        default:
            return;
    }
    let sign = (value < 0) ? 1 : 0;
    value = Math.abs(value);
    let fullNum = Math.floor(value);
    let decimal = value - fullNum;
    let decMantissaLimit = ((size * 8) - 1 - exponentBitCount) - fullNum.toString(2).length + 3;
    let decMantissa = '';
    for (let i = 0; i < decMantissaLimit; i++) {
        decimal *= 2;
        decMantissa += Math.floor(decimal);
        if (decimal >= 1)
            decimal -= 1;
    }
    let rounding = decMantissa.substring(decMantissa.length - 2);
    decMantissa = decMantissa.substring(0, decMantissa.length - 2);
    console.log(decMantissa, rounding);
    if (rounding.charAt(0) === '1') {
        decMantissa = (parseInt(decMantissa, 2) + 1).toString(2);
        if (/^10+$/.test(decMantissa)) {
            fullNum += 1;
            decMantissa = '';
        }
    }
    let exponent = fullNum.toString(2).length - 1 + (Math.pow(2, exponentBitCount) / 2 - 1);
    if (fullNum === 0) {
        if (decMantissa === '')
            exponent = 0;
        else
            exponent = (Math.pow(2, exponentBitCount) / 2 - 1) - decMantissa.match(/^(0*)/)[0].length - 1;
    }
    let expBin = exponent.toString(2).padStart(exponentBitCount, '0');
    let fullBin = sign +
        expBin +
        (fullNum.toString(2) + decMantissa).padEnd(((size * 8) - 1 - exponentBitCount) - fullNum.toString(2).length, '0').substring(1);
    console.log(sign, expBin, (fullNum.toString(2) + decMantissa).padEnd(((size * 8) - 1 - exponentBitCount) - fullNum.toString(2).length, '0').substring(1));
    let out = [];
    for (let i = 0; i < (size * 8); i += 8) {
        out.push(parseInt(fullBin.substring(i, i + 8), 2));
    }
    if (endianness === 'little')
        out.reverse();
    if (value === 0)
        out.fill(0);
    return out;
}
