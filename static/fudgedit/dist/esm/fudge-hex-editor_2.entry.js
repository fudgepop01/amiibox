import { f as forceUpdate, r as registerInstance, c as createEvent, h } from './index-4a361179.js';

function isInprogress(piece) {
    if (piece instanceof InProgress)
        return true;
    else
        return false;
}
function last(arr) {
    if (arr.length > 0)
        return arr[arr.length - 1];
    return undefined;
}
class Existing {
    constructor(offset, length, modified = 0, myType) {
        this.offset = offset;
        this.length = length;
        this.modified = modified;
        this.myType = myType;
        this.self = this;
    }
    splitAt(position) {
        const left = this.makeNew(this.mOffset, position);
        const right = this.makeNew(this.offset + position, this.length - position, this.modified);
        if (left.length === 0) {
            this.self = [right];
            return [undefined, right];
        }
        if (right.mLength === 0) {
            this.self = [left];
            return [left, undefined];
        }
        return (this.self = [left, right]);
    }
    isContinuedBy(other) {
        if (other instanceof this.myType) {
            return this.mLength + this.mOffset === other.mOffset && this.editNum === other.editNum;
        }
        return false;
    }
    join(other) {
        return (this.self = this.makeNew(this.mOffset, this.mLength + other.mLength));
    }
    get isSelf() { return this === this.self; }
    get mOffset() { return this.offset + this.modified; }
    get mLength() { return this.length - this.modified; }
    get pieces() {
        if (Array.isArray(this.self)) {
            if (this.self.length === 1)
                return [...this.self[0].pieces];
            return [...this.self[0].pieces, ...this.self[1].pieces];
        }
        return [this.self];
    }
}
class Original extends Existing {
    constructor(offset, length, modified = 0) {
        super(offset, length, modified, Original);
    }
    makeNew(offset, length, modified) {
        return new Original(offset, length, modified);
    }
}
class Added extends Existing {
    constructor(offset, length, type, editNum, consumption = [], modified = 0) {
        super(offset, length, modified, Added);
        this.type = type;
        this.editNum = editNum;
        this.consumption = consumption;
    }
    makeNew(offset, length, modified) {
        return new Added(offset, length, this.type, this.editNum, this.consumption, modified);
    }
}
class InProgress {
    constructor(offset, type, editNum, index) {
        this.offset = offset;
        this.type = type;
        this.editNum = editNum;
        this.index = index;
        this.content = [];
        this.consumption = [];
    }
    get length() { return this.content.length; }
    get modified() { return 0; }
    get mLength() { return this.length; }
    get mOffset() { return this.offset; }
    get pieces() { return [this]; }
}
/**
 * controls the editing of values in the hex editor
 */
class EditController {
    constructor(parent) {
        this.parent = parent;
        this.added = new Uint8Array();
        this.pieces = [];
        this.undoStack = [];
        this.redoStack = [];
        this.chunk = '';
        this.original = parent.file;
        this.pieces = [new Original(0, this.original.length)];
        window['rollback'] = () => {
            this.rollback();
            console.log(this.pieces);
        };
        window['ec'] = this;
    }
    initEdit(offset, type) {
        if (this.redoStack.length > 0)
            this.rollback();
        this.inProgress = new InProgress(this.added.length, type, this.undoStack.length + 1, -1);
        let { targetIndex, targetSlicePoint, target } = this.getPieceAtOffset(offset);
        if (target instanceof Existing) {
            const splitParts = target.splitAt(targetSlicePoint);
            let toInsert;
            if (!splitParts[0]) {
                this.inProgress.index = targetIndex;
                toInsert = [this.inProgress, splitParts[1]];
            }
            else if (!splitParts[1]) {
                this.inProgress.index = targetIndex + 1;
                toInsert = [splitParts[0], this.inProgress];
            }
            else {
                this.inProgress.index = targetIndex + 1;
                toInsert = [
                    splitParts[0],
                    this.inProgress,
                    splitParts[1]
                ];
            }
            this.pieces.splice(targetIndex, 1, ...toInsert);
        }
        this.undoStack.push(this.inProgress);
    }
    /**
     * gets the piece at an offset
     * @param offset
     */
    getPieceAtOffset(offset) {
        let tracker = 0;
        let targetSlicePoint;
        let targetIndex;
        let target;
        for (const [i, piece] of this.pieces.entries()) {
            tracker += piece.mLength;
            if (tracker >= offset) {
                targetSlicePoint = piece.mLength - tracker + offset;
                targetIndex = i;
                target = piece;
                break;
            }
        }
        return {
            targetSlicePoint,
            targetIndex,
            target
        };
    }
    get isInProgress() { return !!this.inProgress; }
    /**
     * targets the piece next to the inProgress piece, if it exists, and
     * modifies its length/offset by amount if the inProgress type is
     * set to 'overwrite'.
     *
     * @param amount - the amount to modify the target piece's length by
     */
    modifyNextPiece(amount, index, piece) {
        const target = piece ? piece : this.inProgress;
        if (index !== this.pieces.length - 1) {
            let lastConsumption = last(target.consumption);
            if (lastConsumption === undefined || lastConsumption.consumed) {
                const nextPiece = this.pieces[index + 1];
                lastConsumption = {
                    consumed: false,
                    piece: nextPiece,
                    startMod: nextPiece.modified
                };
                target.consumption.push(lastConsumption);
            }
            lastConsumption.piece.modified -= amount;
            if (lastConsumption.piece.mLength === 0) {
                lastConsumption.consumed = true;
                this.pieces.splice(index + 1, 1);
            }
        }
    }
    find(searchArr, from, maxLength) {
        // Boyer-Moore string search algorithm:
        // https://en.wikipedia.org/wiki/Boyer%E2%80%93Moore_string-search_algorithm
        const results = [];
        let myChunk = this.render(from, maxLength ? maxLength : this.length - from).out;
        let inf = 0;
        for (let i = searchArr.length; i < myChunk.length; i++) {
            if (myChunk[i] === searchArr[searchArr.length - 1]) {
                for (let j = searchArr.length - 1; j >= 0; j--) {
                    if (j === 0) {
                        results.push(i + from - searchArr.length + 1);
                        break;
                    }
                    if (myChunk[i - (searchArr.length - j)] !== searchArr[j - 1]) {
                        i += (j - 1);
                        break;
                    }
                }
            }
            else {
                const searchIdx = searchArr.lastIndexOf(myChunk[i]);
                if (searchIdx === -1)
                    i += searchArr.length - 1;
                else {
                    i += searchArr.length - searchIdx - 2;
                }
            }
            // JUUUST to be sure there's no infinite loop
            inf++;
            if (inf > 100000)
                break;
        }
        return results;
    }
    redo() {
        if (this.redoStack.length > 0) {
            const [neighbor, startMod, toAdd] = this.redoStack.pop();
            const idx = this.pieces.indexOf(neighbor);
            // console.log(idx);
            if (toAdd.type === 'insert') {
                this.pieces.splice(idx, 0, ...toAdd.pieces);
            }
            else {
                let partialConsume = 0;
                let lp = last(toAdd.consumption);
                if (!lp.consumed)
                    partialConsume = 1;
                if (!isNaN(startMod)) {
                    if (!lp.piece.isSelf) {
                        lp.piece.pieces[0].modified = startMod;
                    }
                    else {
                        lp.piece.modified = startMod;
                    }
                }
                this.pieces.splice(idx, toAdd.consumption.length - partialConsume, ...toAdd.pieces);
            }
            this.undoStack.push(toAdd);
            forceUpdate(this.parent);
        }
    }
    undo() {
        if (this.isInProgress) {
            this.commit();
            this.chunk = '';
        }
        if (this.undoStack.length > 0) {
            // get the latest undo
            const target = this.undoStack.pop();
            // get the first piece of that undo step
            const targetIdx = this.pieces.indexOf(target.pieces[0]);
            let neighbor;
            let lastMod = NaN;
            // determine type of operation
            if (target instanceof Added && target.type === 'overwrite') {
                // if type was overwrite, then there are more steps necessary
                // due to the potential to consume other pieces,
                // all of which will need to be restored
                // restore all pieces that have been FULLY consumed
                // store those that have only been partially consumed
                const restored = [];
                const partiallyConsumed = [];
                for (const t of target.consumption) {
                    if (t.consumed) {
                        t.piece.modified = t.startMod;
                        restored.push(t.piece);
                    }
                    else {
                        partiallyConsumed.push(t);
                    }
                }
                // put restored pieces back while removing target
                this.pieces.splice(targetIdx, target.pieces.length, ...restored);
                // store the neighbor
                neighbor = this.pieces[targetIdx];
                // due to not "rolling back" every undo, the stored piece might actually be multiple
                // pieces. This is kept track of with the piece's 'self' variable.
                if (partiallyConsumed.length) {
                    // store the modified value of the partially consumed piece for redo
                    if (!partiallyConsumed[0].piece.isSelf) {
                        const pieces = partiallyConsumed[0].piece.pieces;
                        // we only need to modify the first one because the others should have been
                        // taken care of by other undo operations (in theory)
                        lastMod = pieces[0].modified;
                        pieces[0].modified = partiallyConsumed[0].startMod - partiallyConsumed[0].piece.modified;
                    }
                    else {
                        lastMod = partiallyConsumed[0].piece.modified;
                        partiallyConsumed[0].piece.modified = partiallyConsumed[0].startMod;
                    }
                }
            }
            else {
                // if the type was insert then the piece can simply be extracted without issue
                this.pieces.splice(targetIdx, target.pieces.length);
                // store the neighbor
                neighbor = this.pieces[targetIdx];
            }
            this.redoStack.push([neighbor, lastMod, target]);
            forceUpdate(this.parent);
        }
    }
    // pressing backspace will be handled differently depending on:
    // whether something is in-progress, and whether the editingMode of the
    // parent is 'byte'/'ascii' or 'bit'
    backSpace() {
        if (this.inProgress) {
            this.chunk = '';
            this.inProgress.content.pop();
            this.parent.setCursorPosition(this.parent.cursor - 1);
            this.modifyNextPiece(1, this.inProgress.index);
        }
    }
    /**
     * builds the edit
     *
     * @param {KeyboardEvent} keyStroke
     * @memberof EditController
     */
    buildEdit(keyStroke) {
        if (!this.parent.cursor || this.parent.cursor === -1)
            return;
        if (keyStroke.key === 'Z' && (keyStroke.metaKey || keyStroke.ctrlKey)) {
            this.redo();
            return;
        }
        if (keyStroke.key === 'z' && (keyStroke.metaKey || keyStroke.ctrlKey)) {
            this.undo();
            return;
        }
        if (keyStroke.key === 'Backspace') {
            this.backSpace();
            return;
        }
        // ascii and byte modes are effectively the same in terms of editing
        // binary editing is very different, so it is handled in the else statement
        if (['ascii', 'byte'].includes(this.parent.editingMode)) {
            if (!this.isInProgress)
                this.initEdit(this.parent.cursor, this.parent.editType);
            if (this.parent.editingMode === 'ascii' && keyStroke.key.length === 1 && /[\u0000-\u00FF]/.test(keyStroke.key)) {
                this.inProgress.content.push(keyStroke.key.charCodeAt(0));
                this.parent.setCursorPosition(this.parent.cursor + 1);
                if (this.inProgress.type === 'overwrite')
                    this.modifyNextPiece(-1, this.inProgress.index);
            }
            else if (this.parent.editingMode === 'byte' && /^[a-fA-F0-9]$/.test(keyStroke.key)) {
                this.chunk += keyStroke.key;
                if (this.chunk.length === 2) {
                    this.inProgress.content.push(parseInt(this.chunk, 16));
                    this.chunk = '';
                    this.parent.setCursorPosition(this.parent.cursor + 1);
                    if (this.inProgress.type === 'overwrite')
                        this.modifyNextPiece(-1, this.inProgress.index);
                }
            }
        }
        // valid binary editing commands are 0, 1, and Enter
        else if (this.parent.editingMode === 'bit' && ['0', '1', 'Enter'].includes(keyStroke.key)) {
            if (keyStroke.key === 'Enter') {
                // enter inserts a blank byte
                this.initEdit(this.parent.cursor, 'insert');
                this.inProgress.content.push(0);
                this.commit();
                forceUpdate(this.parent);
            }
            else {
                if (!this.isInProgress)
                    this.initEdit(this.parent.cursor, 'overwrite');
                this.parent.setCursorPosition(this.parent.cursor, this.parent.bit + 1);
            }
        }
    }
    commit() {
        const newArr = new Uint8Array(this.added.length + this.inProgress.content.length);
        newArr.set(this.added, 0);
        newArr.set(this.inProgress.content, this.added.length);
        const newAddedPiece = new Added(newArr.length - this.inProgress.length, this.inProgress.length, this.inProgress.type, this.inProgress.editNum, this.inProgress.consumption);
        this.pieces[this.inProgress.index] = newAddedPiece;
        this.undoStack[this.undoStack.length - 1] = newAddedPiece;
        this.added = newArr;
        this.inProgress = null;
        this.chunk = '';
    }
    rollback() {
        let chopLength = 0;
        while (this.redoStack.length > 0) {
            chopLength += this.redoStack.pop()[2].length;
        }
        let newArr = new Uint8Array(this.added.length - chopLength);
        newArr.set(this.added.subarray(0, newArr.length), 0);
        this.added = newArr;
        for (let i = 0; i < this.pieces.length - 1; i++) {
            const p1 = this.pieces[i];
            const p2 = this.pieces[i + 1];
            if (p1.isContinuedBy(p2)) {
                this.pieces.splice(i, 2, p1.join(p2));
                i--;
            }
        }
    }
    render(start, length) {
        let out = new Uint8Array(length);
        let meta = { added: [] };
        let tracker = 0;
        let startPlace;
        let startIndex = 0;
        for (const [i, piece] of this.pieces.entries()) {
            tracker += piece.mLength;
            if (tracker >= start) {
                startPlace = piece.mLength - tracker + start;
                startIndex = i;
                break;
            }
        }
        if (isInprogress(this.pieces[startIndex]) || this.pieces[startIndex] instanceof Added) {
            meta.added.push([start - startPlace, start - startPlace + this.pieces[startIndex].length]);
        }
        let firstChunk = this.getPieceBuffer(this.pieces[startIndex]).subarray(startPlace, startPlace + length);
        tracker = firstChunk.length;
        out.set(firstChunk, 0);
        for (let i = startIndex + 1; i < this.pieces.length; i++) {
            let piece = this.pieces[i];
            tracker += piece.mLength;
            if (isInprogress(piece) || piece instanceof Added) {
                meta.added.push([start + tracker - piece.mLength, start + tracker]);
            }
            if (tracker >= length) {
                out.set(this.getPieceBuffer(piece).subarray(0, piece.mLength - tracker + length), tracker - piece.mLength);
                break;
            }
            out.set(this.getPieceBuffer(piece), tracker - piece.mLength);
        }
        if (tracker !== length) {
            return {
                out: out.subarray(0, tracker),
                meta
            };
        }
        return {
            out,
            meta
        };
    }
    get length() {
        let lengthCheck = 0;
        for (const piece of this.pieces) {
            lengthCheck += piece.length;
        }
        return lengthCheck;
    }
    save() {
        return this.render(0, this.length).out;
    }
    getPieceBuffer(piece) {
        if (isInprogress(piece)) {
            return new Uint8Array(piece.content);
        }
        // implied else
        if (piece instanceof Original) {
            return this.original.subarray(piece.mOffset, piece.mOffset + piece.mLength);
        }
        else {
            return this.added.subarray(piece.mOffset, piece.mOffset + piece.mLength);
        }
    }
}

function floatToBin(value, size, endianness) {
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

const hexEditorCss = ".fudgedit-container{overflow:hidden;position:relative;min-height:100%;color:black}.hex{font-family:'Sourcecode Pro', Courier, monospace;font-size:15px;height:100%;outline:none}.binView,.hexView,.asciiView,.lineLabels{display:inline-block;padding:0 10px;white-space:pre;position:relative}.binLine span,.hexLine span,.charLine span{position:relative;height:17px;display:inline-block}.lineLabel{height:17px}.binLine>span>span{position:relative;width:14px;padding:0 3px;-webkit-box-sizing:border-box;box-sizing:border-box}.binLine span{padding:0 0px}.binLine>span>span.padBit::after{background-color:#0006;position:absolute;width:1px;height:100%;left:calc(100% + 0.5px);content:''}.binLine>span>span:last-child.padBit::after{width:2px;left:100%}.binLine>span:last-child>span:last-child.padBit::after{display:none}.charLine span{width:10px}.hexLine span{position:relative;padding:0 5px;width:28px;-webkit-box-sizing:border-box;box-sizing:border-box}.hexLine span:not(:last-child).padByte::after{background-color:#0006;position:absolute;width:2px;height:100%;left:calc(100% - 1px);content:''}.binLine span,.hexLine span{cursor:default;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.binLine span.selected,.charLine span.selected,.hexLine span.selected{background-color:#8888FF80}.binLine span.cursor,.charLine span.cursor,.hexLine span.cursor{background-color:#008;color:#FFF}.binLine>span.added,.charLine span.added,.hexLine span.added{color:red}.binLine>span>span:hover,.charLine span:hover,.hexLine span:hover{background-color:#000;color:#FFF}.hexLine span.ASCII{font-weight:bold}.binLine:nth-child(2n-1),.hexLine:nth-child(2n-1),.charLine:nth-child(2n-1),.lineLabel:nth-child(2n-1){background-color:#EEFFFF;mix-blend-mode:multiply}.binLine.selected,.charLine.selected,.hexLine.selected,.lineLabel.selected{background-color:#FFA}.separator{opacity:0;pointer-events:none}.region{opacity:1}.highlight{mix-blend-mode:multiply}.region{position:relative}.highlight:hover .region:not(:hover){fill:#0003}.find{width:calc(100% - 20px);height:50px;position:absolute;bottom:0;left:0;right:0;margin:auto;background-color:#fff;z-index:4}";

const HexEditor = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        // keeps track of which line is displayed
        this.lineNumber = 0;
        // the type of search to be executed
        this.searchType = 'ascii';
        // number of bytes the search should have (used when integer or float)
        this.searchByteCount = 1;
        // endianness of the search
        this.searchEndian = 'big';
        // input to search for
        this.searchInput = '';
        // results of the search
        this.searchResults = [];
        // whether or not to display the search window
        this.searchActive = false;
        // !SECTION
        // SECTION PROPS
        /**
         * weather or not to display ASCII on the side
         *
         * @type {boolean}
         * @memberof HexEditor
         */
        this.displayAscii = true;
        /**
         * weather or not to display Hex
         *
         * @type {boolean}
         * @memberof HexEditor
         */
        this.displayHex = true;
        /**
         * weather or not to display binary
         *
         * @type {boolean}
         * @memberof HexEditor
         */
        this.displayBin = false;
        /**
         * the number of lines to display at once
         *
         * @type {number}
         * @memberof HexEditor
         */
        this.maxLines = 30;
        /**
         * the number of bytes to display per line
         *
         * @type {number}
         * @memberof HexEditor
         */
        this.bytesPerLine = 16;
        /**
         * definitions for each chunk to display when
         * displayAsChunks is enabled
         *
         * @type {number[]}
         * @memberof HexEditor
         */
        this.chunks = [];
        /**
         * displays the file as chunks (defined above)
         *
         * @type {boolean}
         * @memberof HexEditor
         */
        this.displayAsChunks = false;
        /**
         * weather or not to replace typical ASCII values
         * with their ASCII value representation
         * ( ex: 0x61 ==> ".a" )
         *
         * @type {boolean}
         * @memberof HexEditor
         */
        this.asciiInline = false;
        /**
         * the number of chunks between separators
         *
         * @type {number}
         * @memberof HexEditor
         */
        this.bytesPerGroup = 4;
        /**
         * the number of bits between separators
         * on the bit display
         *
         * @type {number}
         * @memberof HexEditor
         */
        this.bitsPerGroup = 8;
        /**
         * the mode of operation:
         * region:
         *    used to highlight different regions. Hovering over
         *    a region displays a tooltip
         * edit:
         *    regions are displayed in the background, allowing
         *    the user to edit directly
         * noregion:
         *    regions are not displayed at all
         *
         * @type {("region" | "edit" | "noregion")}
         * @memberof HexEditor
         */
        this.mode = "select";
        /**
         * the mode of data entry:
         * insert:
         *    inserts data between bytes
         * overwrite:
         *    overwrites the currently selected byte
         * readonly:
         *    no edits are possible
         *
         * @type {("insert" | "overwrite" | "readonly")}
         * @memberof HexEditor
         */
        this.editType = "readonly";
        /**
         * the number of regions to traverse
         *
         * @type {number}
         * @memberof HexEditor
         */
        this.regionDepth = 2;
        /**
         * the region data. Data will be displayed in the tooltip
         * if mode is set to "region"
         *
         * @type {IRegion[]}
         * @memberof HexEditor
         */
        this.regions = [];
        /**
         * This must be an arrow function so it retains the reference to
         * "this" while also not being anonymous. This allows it to be
         * added as an eventlistener directly while retaining the ability
         * to remove it.
         *
         * @memberof MyComponent
         */
        this.scroll = (evt) => {
            evt.preventDefault();
            let scaledVelocity = (!Number.isInteger(evt.deltaY)) ? Math.ceil(evt.deltaY / 100) : Math.ceil(evt.deltaY / 2);
            if (scaledVelocity === -0)
                scaledVelocity -= 1;
            if (this.lineNumber + scaledVelocity < 0)
                this.lineNumber = 0;
            else if (this.lineNumber + scaledVelocity > Math.floor(this.editController.length / this.bytesPerLine) - 1)
                this.lineNumber = Math.floor(this.editController.length / this.bytesPerLine) - 1;
            else
                this.lineNumber += scaledVelocity;
        };
        this.hexLineChanged = createEvent(this, "hexLineChanged", 7);
        this.hexCursorChanged = createEvent(this, "hexCursorChanged", 7);
        this.hexSelectionChanged = createEvent(this, "hexSelectionChanged", 7);
        this.hexDataChanged = createEvent(this, "hexDataChanged", 7);
        this.hexLoaded = createEvent(this, "hexLoaded", 7);
    }
    // !SECTION
    // SECTION COMPONENT LIFECYCLE METHODS
    componentWillLoad() {
        this.file = new Uint8Array(1024).map((_, i) => i % 256);
        this.editController = new EditController(this);
        this.regionScaleWidth = 28;
        this.regionScaleHeight = 17;
    }
    componentDidLoad() {
        this.hexLoaded.emit(this.editController);
    }
    // !SECTION
    // SECTION LISTENERS
    // !SECTION
    // SECTION EXPOSED API
    /**
    * accepts and reads the given file, storing the result in
    * the file variable
    * @param file
    */
    async acceptFile(file) {
        console.log(file);
        this.fileMetadata = file;
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = (event) => {
            this.file = new Uint8Array(event.target.result);
            this.editController = new EditController(this);
        };
    }
    /**
     * returns the edited file
     *
     * @returns {(Promise<Uint8Array | void>)}
     * @memberof HexEditor
     */
    async saveFile() {
        if (this.file == undefined)
            return;
        return this.editController.save();
    }
    /**
     * sets the line number
     *
     * @param {number} newLineNumber
     * @memberof HexEditor
     */
    async setLineNumber(newLineNumber) {
        if (newLineNumber < 0)
            this.lineNumber = 0;
        else
            this.lineNumber = newLineNumber;
        this.hexLineChanged.emit(this.lineNumber);
    }
    /**
     * sets the new cursor position
     *
     * @param {number} newCursorPosition
     * @memberof HexEditor
     */
    async setCursorPosition(newCursorPosition, bit) {
        if (bit) {
            let adjustMain = 0;
            if (bit >= 8)
                adjustMain = Math.floor(bit / 8);
            this.cursor = newCursorPosition + adjustMain;
            this.bit = bit % 8;
        }
        else {
            this.cursor = newCursorPosition;
        }
        this.hexCursorChanged.emit({ byte: this.cursor, bit: this.bit });
    }
    /**
     * sets the new selection bounds.
     * @param {{start?: number, end?: number}} newSelection
     * @memberof HexEditor
     */
    async setSelection(newSelection) {
        this.selection = Object.assign(Object.assign({}, this.selection), newSelection);
        this.hexSelectionChanged.emit(this.selection);
    }
    /**
     * fetches a Uint8Array of a given length
     * at the given location
     * @param location where to fetch the data from
     * @param length how many bytes to load
     * @memberof HexEditor
     */
    async getChunk(location, length) {
        return this.editController.render(location, length);
    }
    /**
     * returns the file's metadata
     * @memberof HexEditor
     */
    async getFileMetadata() {
        return this.fileMetadata;
    }
    /**
     * executes a search in the currently loaded file with the supplied parameters
     *
     * @param {string} text
     * @param {typeof HexEditor.prototype.searchType} searchType
     * @param {[number, number]} range
     * @param {(1 | 2 | 4 | 8)} [searchByteCount]
     * @param {('big' | 'little')} [searchEndian]
     * @memberof HexEditor
     */
    async executeSearch(text, searchType, range, searchByteCount, searchEndian) {
        let searchArr;
        try {
            searchArr = this.formatSearch(text, searchType, searchByteCount, searchEndian);
        }
        catch (e) {
            console.log(e);
        }
        this.searchResults = this.editController.find(searchArr, range ? range[0] : 0, range ? range[1] - range[0] : undefined);
        return this.searchResults;
    }
    // !SECTION
    // LOCAL METHODS
    /**
     * builds the elements responsible for the hex view
     */
    buildHexView() {
        const { lineNumber, maxLines, bytesPerLine, bytesPerGroup, bitsPerGroup, asciiInline } = this;
        const start = lineNumber * bytesPerLine;
        const chunkData = this.editController.render(start, maxLines * bytesPerLine);
        const chunk = chunkData.out;
        const addedRanges = chunkData.meta.added;
        const lines = [];
        for (let i = 0; i < maxLines; i++) {
            lines.push(chunk.subarray(i * bytesPerLine, (i + 1) * bytesPerLine));
        }
        const binViews = [];
        const lineViews = [];
        const charViews = [];
        let selectedLine = -1;
        for (const [lineNum, line] of lines.entries()) {
            if (line.length === 0)
                break;
            // setup variables
            const base = start + lineNum * bytesPerLine;
            const binLines = [];
            const charLines = [];
            const hexLines = [];
            let ascii = '•';
            // sets up everything else.
            for (const [position, val] of [...line.values()].entries()) {
                let out;
                if (/\w|[!@#$%^&*()_+=\]\\:;"'>.<,/?]/.test(String.fromCharCode(val))) {
                    ascii = String.fromCharCode(val);
                }
                else {
                    ascii = '•';
                }
                if (asciiInline && /\w/.test(ascii)) {
                    out = "." + ascii;
                }
                else {
                    out = val.toString(16).toUpperCase().padStart(2, '0');
                }
                // classes
                const classList = [];
                if (out.startsWith('.'))
                    classList.push('ASCII');
                if (position % bytesPerGroup === bytesPerGroup - 1)
                    classList.push('padByte');
                if (Math.floor(this.cursor) === base + position) {
                    classList.push('cursor');
                    selectedLine = lineNum;
                }
                if (this.selection && this.selection.start <= base + position && base + position <= this.selection.end)
                    classList.push('selected');
                for (const [start, end] of addedRanges) {
                    if (start <= base + position && base + position < end) {
                        classList.push('added');
                        break;
                    }
                }
                // binary spans are more complicated than the others
                // they are split into 8 pieces (the 8 bits that make up a byte)
                let binArr = val.toString(2).padStart(8, '0').split('');
                let binSpans = [];
                if (this.displayBin) {
                    for (let i = 0; i < binArr.length; i++) {
                        let binClass = '';
                        if ((position * 8 + i) % bitsPerGroup == bitsPerGroup - 1)
                            binClass += 'padBit';
                        if (classList.includes('cursor') && (this.bit === i || this.bit === -1))
                            binClass += ' cursor';
                        if (classList.includes('selected')) {
                            if (this.selection.start === this.selection.end) {
                                if (i >= this.selection.startBit && i <= this.selection.endBit)
                                    binClass += ' selected';
                            }
                            else if (this.selection.start === base + position) {
                                if (i >= this.selection.startBit)
                                    binClass += ' selected';
                            }
                            else if (this.selection.end === base + position) {
                                if (i <= this.selection.endBit || this.selection.endBit === -1)
                                    binClass += ' selected';
                            }
                            else
                                binClass += ' selected';
                        }
                        binSpans.push(h("span", { "data-cursor-idx": i, class: binClass }, binArr[i]));
                    }
                }
                if (this.displayBin)
                    binLines.push(h("span", { "data-cursor-idx": base + position, class: "binGroup" + (classList.includes('added') ? ' added' : '') }, binSpans));
                if (this.displayAscii)
                    charLines.push(h("span", { "data-cursor-idx": base + position, class: classList.join(' ') }, ascii));
                if (this.displayHex)
                    hexLines.push(h("span", { "data-cursor-idx": base + position, class: classList.join(' ') }, out));
            }
            if (this.displayBin)
                binViews.push((h("div", { class: 'binLine' + (selectedLine === lineNum ? ' selected' : '') }, binLines)));
            if (this.displayHex) {
                lineViews.push((h("div", { class: 'hexLine' + (selectedLine === lineNum ? ' selected' : '') }, hexLines)));
            }
            else {
                lineViews.push({});
            }
            if (this.displayAscii)
                charViews.push((h("div", { class: 'charLine' + (selectedLine === lineNum ? ' selected' : '') }, charLines)));
        }
        // fill extra space
        while (lineViews.length < maxLines) {
            binViews.push(h("div", { class: "binLine", style: { pointerEvents: 'none' } }, h("span", null, "-")));
            lineViews.push(h("div", { class: "hexLine", style: { pointerEvents: 'none' } }, h("span", null, "-")));
            charViews.push(h("div", { class: "charLine", style: { pointerEvents: 'none' } }, h("span", null, "-")));
        }
        // line number builder
        const lineLabels = [];
        for (let i = 0; i < maxLines; i++) {
            lineLabels.push(h("div", { class: 'lineLabel' + (selectedLine === i ? ' selected' : ''), style: { pointerEvents: 'none' } }, '0x' + (start + i * bytesPerLine).toString(16).padStart(8, ' ')));
        }
        // regions
        const binRegionMarkers = [];
        const hexRegionMarkers = [];
        const asciiRegionMarkers = [];
        const buildRegion = (region, depth = 0, index) => {
            if (region.end < start || region.start > start + this.maxLines * this.bytesPerLine) {
                if (region.subRegions && depth + 1 !== this.regionDepth) {
                    for (const [i, r] of region.subRegions.entries())
                        buildRegion(r, depth + 1, i);
                }
                return;
            }
            if (depth === this.regionDepth)
                return;
            // start / end offsets
            const s = region.start % this.bytesPerLine;
            const e = region.end % this.bytesPerLine;
            // l is the "height" of the region. It was a bit confusing, so allow me to explain:
            // instead of only taking into account the start and end of the region's offsets,
            // what we ACTUALLY want is the start and end while taking into account the offset
            // provided by 's'
            const l = Math.floor((region.end - region.start + s) / this.bytesPerLine);
            const offset = Math.floor(region.start / this.bytesPerLine) - lineNumber;
            const getColor = {
                0: ['#88F', '#BBF'],
                1: ['#F88', '#FBB'],
                2: ['#8D8', '#BDB']
            };
            const genPolygon = (width, height) => (h("polygon", { onMouseMove: (evt) => {
                    if (this.canUpdateMouseMove === undefined) {
                        this.canUpdateMouseMove = true;
                    }
                    if (this.canUpdateMouseMove) {
                        this.canUpdateMouseMove = false;
                        document.documentElement.style.setProperty('--mouse-x', `${evt.clientX}`);
                        document.documentElement.style.setProperty('--mouse-y', `${evt.clientY}`);
                        document.getElementById('tooltip').setAttribute('active', 'true');
                        document.getElementById('tooltip').setAttribute('complex', `${JSON.stringify(Object.assign(Object.assign({}, region), { subRegions: region.subRegions ? region.subRegions.map(sr => sr.name) : null }))}`);
                        setTimeout(() => { this.canUpdateMouseMove = true; }, 50);
                    }
                }, onMouseLeave: () => document.getElementById('tooltip').setAttribute('active', 'false'), class: "region", points: `
              0,${(1 + offset) * height}
              ${s * width},${(1 + offset) * height}
              ${s * width},${offset * height}
              ${this.bytesPerLine * width},${offset * height}
              ${this.bytesPerLine * width},${(l + offset) * height}
              ${e * width},${(l + offset) * height}
              ${e * width},${(l + offset + 1) * height}
              0,${(l + 1 + offset) * height}
            `, fill: region.color || getColor[depth % 3][index % 2], stroke: "none" }));
            binRegionMarkers.push(genPolygon(14 * 8, this.regionScaleHeight));
            hexRegionMarkers.push(genPolygon(this.regionScaleWidth, this.regionScaleHeight));
            asciiRegionMarkers.push(genPolygon(10, this.regionScaleHeight));
            // if regions don't work right in the future then the if condition below is the reason why
            if (region.subRegions && depth + 1 !== this.regionDepth) {
                for (const [i, r] of region.subRegions.entries())
                    buildRegion(r, depth + 1, i);
            }
            // }
        };
        for (const [i, region] of this.regions.entries()) {
            buildRegion(region, 0, i);
        }
        // style={{width: this.bytesPerLine * this.regionScaleWidth, height: this.maxLines * this.regionScaleHeight}}
        const binRegions = h("svg", { viewBox: `0 0 ${this.bytesPerLine * 14 * 8} ${this.maxLines * this.regionScaleHeight}`, width: `${this.bytesPerLine * 14 * 8}`, height: `${this.maxLines * this.regionScaleHeight}` }, binRegionMarkers);
        const hexRegions = h("svg", { viewBox: `0 0 ${this.bytesPerLine * this.regionScaleWidth} ${this.maxLines * this.regionScaleHeight}`, width: `${this.bytesPerLine * this.regionScaleWidth}`, height: `${this.maxLines * this.regionScaleHeight}` }, hexRegionMarkers);
        const asciiRegions = h("svg", { viewBox: `0 0 ${this.bytesPerLine * 10} ${this.maxLines * this.regionScaleHeight}`, width: `${this.bytesPerLine * 10}`, height: `${this.maxLines * this.regionScaleHeight}` }, asciiRegionMarkers);
        return {
            lineViews,
            charViews,
            binViews,
            lineLabels,
            binRegions,
            hexRegions,
            asciiRegions
        };
    }
    buildChunks() {
        const { lineNumber, maxLines, bytesPerLine, bytesPerGroup, chunks, bitsPerGroup, asciiInline } = this;
        // console.log(lineNumber);
        const chunkOffset = {
            chunk: 0,
            chunkLineOffs: 0
        };
        // get offset data for the generated chunks
        for (let lNum = lineNumber, j = 0; lNum > 0 && j < chunks.length; lNum--, j++) {
            const acc = Math.floor((chunks[j].end - chunks[j].start) / bytesPerLine) + 1;
            lNum -= acc;
            if (lNum > 0)
                chunkOffset.chunk += 1;
            else
                chunkOffset.chunkLineOffs = acc - lNum * -1;
        }
        // render the chunks, rendering
        // only the parts that are visible
        const renderedChunks = [];
        for (let i = chunkOffset.chunk, lineCount = 0; lineCount < maxLines && i < chunks.length; i++) {
            const startLine = lineCount;
            const chunk = chunks[i];
            let actualStart = chunk.start;
            if (i == chunkOffset.chunk)
                actualStart += bytesPerLine * chunkOffset.chunkLineOffs;
            if (chunk.end - actualStart <= 0) {
                // renderedChunks.push({data: new Uint8Array(0), start: -1, startLine: -1, endLine: -1});
                continue;
            }
            lineCount += Math.ceil((chunk.end - actualStart) / bytesPerLine);
            let actualEnd = chunk.end;
            if (lineCount > maxLines)
                actualEnd -= (lineCount - maxLines) * bytesPerLine;
            // console.log(actualEnd - actualStart);
            const rendered = this.editController.render(actualStart, actualEnd - actualStart).out;
            renderedChunks.push({ start: actualStart, data: rendered, startLine, endLine: lineCount });
            for (let j = 0; j < 1; j++) {
                lineCount += 1;
                renderedChunks.push({ data: new Uint8Array(0), start: -1, startLine: -1, endLine: -1 });
            }
        }
        renderedChunks.pop();
        let lineViews = [];
        let charViews = [];
        let binViews = [];
        let lineLabels = [];
        const binRegionMarkers = [];
        const hexRegionMarkers = [];
        const asciiRegionMarkers = [];
        for (const { start, data, startLine } of renderedChunks) {
            if (start === -1) {
                lineLabels.push(h("div", { class: 'separator', style: { pointerEvents: 'none' } }, "NA"));
                lineViews.push(h("div", { class: 'separator', style: { pointerEvents: 'none' } }, "NA"));
                charViews.push(h("div", { class: 'separator', style: { pointerEvents: 'none' } }, "NA"));
                binViews.push(h("div", { class: 'separator', style: { pointerEvents: 'none' } }, "NA"));
                continue;
            }
            for (let i = 0; i < data.length; i += bytesPerLine) {
                const lineStart = start + i;
                const hexLine = [];
                const charLine = [];
                const binLine = [];
                let selectedLine = -1;
                for (let j = i; j < i + bytesPerLine && j < data.length; j++) {
                    const val = data[j];
                    const position = start + j;
                    let out;
                    let ascii;
                    if (/\w|[!@#$%^&*()_+=\]\\:;"'>.<,/?]/.test(String.fromCharCode(val))) {
                        ascii = String.fromCharCode(val);
                    }
                    else {
                        ascii = '•';
                    }
                    if (asciiInline && /\w/.test(ascii)) {
                        out = "." + ascii;
                    }
                    else {
                        out = val.toString(16).toUpperCase().padStart(2, '0');
                    }
                    // classes
                    const classList = [];
                    if (out.startsWith('.'))
                        classList.push('ASCII');
                    if ((j - i) % bytesPerGroup === bytesPerGroup - 1)
                        classList.push('padByte');
                    if (Math.floor(this.cursor) === position) {
                        classList.push('cursor');
                        selectedLine = lineStart;
                    }
                    if (this.selection && this.selection.start <= position && position <= this.selection.end)
                        classList.push('selected');
                    // binary spans are more complicated than the others
                    // they are split into 8 pieces (the 8 bits that make up a byte)
                    let binArr = val.toString(2).padStart(8, '0').split('');
                    let binSpans = [];
                    if (this.displayBin) {
                        for (let k = 0; k < binArr.length; k++) {
                            let binClass = '';
                            if ((position * 8 + k) % bitsPerGroup == bitsPerGroup - 1)
                                binClass += 'padBit';
                            if (classList.includes('cursor') && (this.bit === k || this.bit === -1))
                                binClass += ' cursor';
                            if (classList.includes('selected')) {
                                if (this.selection.start === this.selection.end) {
                                    if (k >= this.selection.startBit && k <= this.selection.endBit)
                                        binClass += ' selected';
                                }
                                else if (this.selection.start == position) {
                                    if (k >= this.selection.startBit)
                                        binClass += ' selected';
                                }
                                else if (this.selection.end == position) {
                                    if (k <= this.selection.endBit || this.selection.endBit === -1)
                                        binClass += ' selected';
                                }
                                else
                                    binClass += ' selected';
                            }
                            binSpans.push(h("span", { "data-cursor-idx": k, class: binClass }, binArr[k]));
                        }
                    }
                    if (this.displayBin)
                        binLine.push(h("span", { "data-cursor-idx": position, class: "binGroup" + (classList.includes('added') ? ' added' : '') }, binSpans));
                    if (this.displayAscii)
                        charLine.push(h("span", { "data-cursor-idx": position, class: classList.join(' ') }, ascii));
                    if (this.displayHex)
                        hexLine.push(h("span", { "data-cursor-idx": position, class: classList.join(' ') }, out));
                }
                lineLabels.push((h("div", { class: 'lineLabel' + (selectedLine === lineStart ? ' selected' : ''), style: { pointerEvents: 'none' } }, '0x' + (lineStart).toString(16).padStart(8, ' '))));
                if (this.displayBin)
                    binViews.push((h("div", { class: 'binLine' + (selectedLine === lineStart ? ' selected' : '') }, binLine)));
                if (this.displayHex) {
                    lineViews.push((h("div", { class: 'hexLine' + (selectedLine === lineStart ? ' selected' : '') }, hexLine)));
                }
                else {
                    lineViews.push({});
                }
                if (this.displayAscii)
                    charViews.push((h("div", { class: 'charLine' + (selectedLine === lineStart ? ' selected' : '') }, charLine)));
            }
            const buildRegion = (region, depth = 0, index) => {
                const lineCount = Math.floor(data.length / bytesPerLine);
                const horizOffset = start % bytesPerLine;
                if (region.end < start || region.start > start + lineCount * bytesPerLine) {
                    if (region.subRegions && depth + 1 !== this.regionDepth) {
                        for (const [i, r] of region.subRegions.entries())
                            buildRegion(r, depth + 1, i);
                    }
                    return;
                }
                if (depth === this.regionDepth)
                    return;
                const startByte = Math.max(region.start, start);
                const endByte = Math.min(region.end, start + data.length);
                const s = (startByte - horizOffset) % bytesPerLine;
                const e = (endByte - horizOffset) % bytesPerLine;
                const l = Math.floor((endByte - startByte + s) / bytesPerLine);
                const vertOffset = (Math.floor((startByte - start) / bytesPerLine) + startLine);
                // console.log(startLine)
                // console.log(idx, startByte.toString(16), vertOffset);
                const getColor = {
                    0: ['#88F', '#BBF'],
                    1: ['#F88', '#FBB'],
                    2: ['#8D8', '#BDB']
                };
                const genPolygon = (width, height) => (h("polygon", { onMouseMove: (evt) => {
                        if (this.canUpdateMouseMove === undefined) {
                            this.canUpdateMouseMove = true;
                        }
                        if (this.canUpdateMouseMove) {
                            this.canUpdateMouseMove = false;
                            document.documentElement.style.setProperty('--mouse-x', `${evt.clientX}`);
                            document.documentElement.style.setProperty('--mouse-y', `${evt.clientY}`);
                            document.getElementById('tooltip').setAttribute('active', 'true');
                            document.getElementById('tooltip').setAttribute('complex', `${JSON.stringify(Object.assign(Object.assign({}, region), { subRegions: region.subRegions ? region.subRegions.map(sr => sr.name) : null }))}`);
                            setTimeout(() => { this.canUpdateMouseMove = true; }, 50);
                        }
                    }, onMouseLeave: () => document.getElementById('tooltip').setAttribute('active', 'false'), class: "region", points: `
              0,${(1 + vertOffset) * height}
              ${s * width},${(1 + vertOffset) * height}
              ${s * width},${vertOffset * height}
              ${this.bytesPerLine * width},${vertOffset * height}
              ${this.bytesPerLine * width},${(l + vertOffset) * height}
              ${e * width},${(l + vertOffset) * height}
              ${e * width},${(l + vertOffset + 1) * height}
              0,${(l + 1 + vertOffset) * height}
            `, fill: region.color || getColor[depth % 3][index % 2], stroke: "none" }));
                binRegionMarkers.push(genPolygon(14 * 8, this.regionScaleHeight));
                hexRegionMarkers.push(genPolygon(this.regionScaleWidth, this.regionScaleHeight));
                asciiRegionMarkers.push(genPolygon(10, this.regionScaleHeight));
                // if regions don't work right in the future then the if condition below is the reason why
                if (region.subRegions && depth + 1 !== this.regionDepth) {
                    for (const [i, r] of region.subRegions.entries())
                        buildRegion(r, depth + 1, i);
                }
            };
            for (const [i, region] of this.regions.entries()) {
                buildRegion(region, 0, i);
            }
        }
        while (lineViews.length < maxLines) {
            lineLabels.push(h("div", { class: "separator" }, h("span", null, "-")));
            binViews.push(h("div", { class: "separator" }, h("span", null, "-")));
            lineViews.push(h("div", { class: "separator" }, h("span", null, "-")));
            charViews.push(h("div", { class: "separator" }, h("span", null, "-")));
        }
        const binRegions = h("svg", { viewBox: `0 0 ${this.bytesPerLine * 14 * 8} ${this.maxLines * this.regionScaleHeight}`, width: `${this.bytesPerLine * 14 * 8}`, height: `${this.maxLines * this.regionScaleHeight}` }, binRegionMarkers);
        const hexRegions = h("svg", { viewBox: `0 0 ${this.bytesPerLine * this.regionScaleWidth} ${this.maxLines * this.regionScaleHeight}`, width: `${this.bytesPerLine * this.regionScaleWidth}`, height: `${this.maxLines * this.regionScaleHeight}` }, hexRegionMarkers);
        const asciiRegions = h("svg", { viewBox: `0 0 ${this.bytesPerLine * 10} ${this.maxLines * this.regionScaleHeight}`, width: `${this.bytesPerLine * 10}`, height: `${this.maxLines * this.regionScaleHeight}` }, asciiRegionMarkers);
        return {
            lineViews,
            charViews,
            binViews,
            lineLabels,
            binRegions,
            hexRegions,
            asciiRegions
        };
    }
    /**
     * edits the underlying uint8array or
     * adjusts the cursor position
     *
     * @param {KeyboardEvent} evt
     * @returns
     * @memberof HexEditor
     */
    edit(evt) {
        if (evt.target.className !== 'hex')
            return;
        const evtArrowKeyConditions = {
            ArrowDown: () => {
                this.setCursorPosition((this.cursor + this.bytesPerLine > this.editController.length)
                    ? this.editController.length
                    : this.cursor + this.bytesPerLine);
            },
            ArrowUp: () => { this.setCursorPosition((this.cursor - this.bytesPerLine < 0) ? 0 : this.cursor - this.bytesPerLine); },
            ArrowRight: () => {
                this.setCursorPosition((this.cursor + 1 > this.editController.length)
                    ? this.editController.length
                    : this.cursor + 1);
            },
            ArrowLeft: () => { this.setCursorPosition((this.cursor - 1 < 0) ? 0 : this.cursor - 1); }
        };
        if (evtArrowKeyConditions[evt.key]) {
            evt.preventDefault();
            // commits/ends any edits
            if (this.editController.inProgress)
                this.editController.commit();
            // executes key function
            evtArrowKeyConditions[evt.key]();
            // adjusts scroll / selection based on new cursor position
            if (this.cursor > (this.lineNumber + this.maxLines) * this.bytesPerLine - 1)
                this.setLineNumber(Math.floor(this.cursor / this.bytesPerLine) - this.maxLines + 1);
            else if (this.cursor < this.lineNumber * this.bytesPerLine)
                this.setLineNumber(Math.floor(this.cursor / this.bytesPerLine));
            // adjusts selection if shift key is held
            if (evt.shiftKey) {
                if (this.selection.start > this.cursor)
                    this.setSelection({ start: this.cursor });
                else
                    this.setSelection({ end: this.cursor });
            }
            else {
                this.setSelection({ start: this.cursor, end: this.cursor });
            }
        }
        else if ((evt.ctrlKey || evt.metaKey) && evt.key === 'f') {
            // toggles find window
            evt.preventDefault();
            this.searchActive = !this.searchActive;
            forceUpdate(this);
        }
        else {
            if (this.editType === 'readonly')
                return;
            evt.preventDefault();
            this.editController.buildEdit(evt);
        }
    }
    /**
     * turns the search input from the type into an array of numbers
     * that represent its binary equivalent in the format specified
     *
     * @param {string} text
     * @param {typeof HexEditor.prototype.searchType} searchType
     * @param {(1 | 2 | 4 | 8)} [searchByteCount]
     * @param {('big' | 'little')} [searchEndian]
     * @returns {number[]}
     * @memberof HexEditor
     */
    formatSearch(text, searchType, searchByteCount, searchEndian) {
        if (text.length === 0)
            throw new Error('LEN0: there needs to be something to search for...');
        switch (searchType) {
            case 'integer':
                const max = parseInt('0x' + new Array(searchByteCount + 1).join('FF'), 16);
                let v = parseInt(text);
                if (Math.abs(v) > max) {
                    v = max * Math.sign(v);
                }
                const out = v.toString(16).padStart(2 * searchByteCount, '0').match(/.{2}/g).map(v => parseInt(v, 16));
                if (searchEndian === 'little')
                    out.reverse();
                return out;
            case 'float':
                return floatToBin(parseFloat(text), searchByteCount, searchEndian);
            case 'byte':
                if (/[^0-9a-f ,|;]/ig.test(text))
                    throw new Error('UC: Unexpected Character (must be exclusively 0-9 and a-f)');
                else {
                    return text.replace(/[ ,|;]/ig, '').match(/.{2}/g).map(v => parseInt(v, 16));
                }
            case 'ascii':
            default:
                return text.split('').map(ch => ch.charCodeAt(0));
        }
    }
    /**
     * triggers a find operation on the currently selected chunk
     * if there is one, otherwise it searches the full thing
     *
     * @memberof HexEditor
     */
    async findInSelection() {
        const range = this.selection ? this.selection.end - this.selection.start : 0;
        this.searchResults =
            await this.executeSearch(this.searchInput, this.searchType, range === 0
                ? undefined
                : [this.selection.start, this.selection.end], this.searchByteCount, this.searchEndian);
    }
    /**
     * displays the full hexidecimal view
     */
    showHex() {
        const { lineViews, binViews, charViews, lineLabels, binRegions, hexRegions, asciiRegions } = this.buildHexView();
        let searchHexDisplay;
        try {
            searchHexDisplay =
                this.formatSearch(this.searchInput, this.searchType, this.searchByteCount, this.searchEndian)
                    .map(v => v.toString(16).padStart(2, '0')).join(', ');
        }
        catch (e) {
            if (e.message.startsWith('LEN0'))
                searchHexDisplay = '';
            else
                searchHexDisplay = e.message;
        }
        let searchResults;
        if (this.searchActive) {
            const jumpToResult = (val) => {
                let v = parseInt(val);
                this.setCursorPosition(v);
                this.setSelection({
                    start: v,
                    end: v + ((['integer', 'float'].includes(this.searchType)) ? this.searchByteCount : this.searchInput.length) - 1,
                    startBit: -1,
                    endBit: -1
                });
                this.setLineNumber(Math.floor(v / this.bytesPerLine) - this.maxLines / 2);
            };
            searchResults = (h("select", { onChange: (evt) => jumpToResult(evt.target.value) }, this.searchResults.map(v => h("option", { value: v }, `0x${v.toString(16)}`))));
        }
        return (h("div", { class: "hex", onMouseEnter: (evt) => this._toggleScrollListener(evt), onMouseLeave: (evt) => this._toggleScrollListener(evt), onMouseDown: (evt) => this.beginSelection(evt), onMouseUp: (evt) => this.endSelection(evt), tabindex: "0", onKeyDown: (evt) => this.edit(evt) }, h("div", { id: "MEASURE", class: "hex", style: { position: 'absolute', visibility: 'hidden', padding: '0 5px' } }, "AB"), h("div", { class: "lineLabels" }, lineLabels), this.displayBin ?
            h("div", { class: "binView" }, h("div", { class: "highlight", style: { position: 'absolute', top: '0', display: this.mode === 'noregion' ? 'none' : 'block', zIndex: this.mode === 'region' ? '3' : '0' } }, binRegions), h("div", { class: "main" }, binViews))
            : null, this.displayHex ?
            h("div", { class: "hexView" }, h("div", { class: "highlight", style: { position: 'absolute', top: '0', display: this.mode === 'noregion' ? 'none' : 'block', zIndex: this.mode === 'region' ? '3' : '0' } }, hexRegions), h("div", { class: "main" }, lineViews))
            : null, this.displayAscii ?
            h("div", { class: "asciiView" }, h("div", { class: "highlight", style: { position: 'absolute', top: '0', display: this.mode === 'noregion' ? 'none' : 'block', zIndex: this.mode === 'region' ? '3' : '0' } }, asciiRegions), h("div", { class: "main" }, charViews))
            : null, this.searchActive ?
            h("div", { class: "find" }, "search:", h("input", { type: "text", onChange: (evt) => this.searchInput = evt.target.value }), h("select", { onChange: (evt) => this.searchType = evt.target.value }, h("option", { value: "ascii" }, "ASCII string"), h("option", { value: "byte" }, "bytes"), h("option", { value: "integer" }, "integer"), h("option", { value: "float" }, "float")), (['integer', 'float'].includes(this.searchType)) ? [
                h("select", { onChange: (evt) => this.searchByteCount = parseInt(evt.target.value) }, h("option", { value: "1" }, "1 byte"), h("option", { value: "2" }, "2 bytes"), h("option", { value: "4" }, "4 bytes"), h("option", { value: "8" }, "8 bytes")),
                h("select", { onChange: (evt) => this.searchEndian = evt.target.value }, h("option", { value: "big" }, "big endian"), h("option", { value: "little" }, "little endian"))
            ]
                : null, h("button", { onClick: () => this.findInSelection() }, "search"), h("br", null), "hex: ", searchHexDisplay, " | results: ", searchResults)
            : null));
    }
    /**
     * displays the chunks
     *
     * @memberof HexEditor
     */
    showChunks() {
        const { lineViews, binViews, charViews, lineLabels, binRegions, hexRegions, asciiRegions } = this.buildChunks();
        return (h("div", { class: "hex", onMouseEnter: (evt) => this._toggleScrollListener(evt), onMouseLeave: (evt) => this._toggleScrollListener(evt), onMouseDown: (evt) => this.beginSelection(evt), onMouseUp: (evt) => this.endSelection(evt), tabindex: "0", onKeyDown: (evt) => this.edit(evt) }, h("div", { id: "MEASURE", class: "hex", style: { position: 'absolute', visibility: 'hidden', padding: '0 5px' } }, "AB"), h("div", { class: "lineLabels" }, lineLabels), this.displayBin ?
            h("div", { class: "binView" }, h("div", { class: "highlight", style: { position: 'absolute', top: '0', display: this.mode === 'noregion' ? 'none' : 'block', zIndex: this.mode === 'region' ? '3' : '0' } }, binRegions), h("div", { class: "main" }, binViews))
            : null, this.displayHex ?
            h("div", { class: "hexView" }, h("div", { class: "highlight", style: { position: 'absolute', top: '0', display: this.mode === 'noregion' ? 'none' : 'block', zIndex: this.mode === 'region' ? '3' : '0' } }, hexRegions), h("div", { class: "main" }, lineViews))
            : null, this.displayAscii ?
            h("div", { class: "asciiView" }, h("div", { class: "highlight", style: { position: 'absolute', top: '0', display: this.mode === 'noregion' ? 'none' : 'block', zIndex: this.mode === 'region' ? '3' : '0' } }, asciiRegions), h("div", { class: "main" }, charViews))
            : null));
    }
    /**
     * gets the exact position of
     * @param evt the mousedown event
     */
    beginSelection(evt) {
        if (evt.target.id === 'HEX-SCROLLBAR')
            return;
        const parentClassName = evt.target.parentElement.className;
        if (parentClassName.includes('charLine'))
            this.editingMode = 'ascii';
        else if (parentClassName.includes('hexLine'))
            this.editingMode = 'byte';
        else if (parentClassName.includes('binGroup'))
            this.editingMode = 'bit';
        else
            return;
        if (this.editingMode === 'bit') {
            this.tempSelection = {
                byte: parseInt(evt.composedPath()[1].getAttribute('data-cursor-idx')),
                bit: parseInt(evt.target.getAttribute('data-cursor-idx'))
            };
        }
        else {
            this.tempSelection = {
                byte: parseInt(evt.target.getAttribute('data-cursor-idx')),
                bit: -1
            };
        }
    }
    endSelection(evt) {
        if (this.tempSelection === null)
            return;
        const parentClassName = evt.target.parentElement.className;
        if (parentClassName.includes('charLine'))
            this.editingMode = 'ascii';
        else if (parentClassName.includes('hexLine'))
            this.editingMode = 'byte';
        else if (parentClassName.includes('binGroup'))
            this.editingMode = 'bit';
        else
            return;
        let chosen;
        if (this.editingMode === 'bit') {
            chosen = {
                byte: parseInt(evt.composedPath()[1].getAttribute('data-cursor-idx')),
                bit: parseInt(evt.target.getAttribute('data-cursor-idx'))
            };
        }
        else {
            chosen = {
                byte: parseInt(evt.target.getAttribute('data-cursor-idx')),
                bit: -1
            };
        }
        if (this.tempSelection.byte + this.tempSelection.bit / 10 > chosen.byte + chosen.bit / 10) {
            this.setSelection({
                start: chosen.byte,
                startBit: chosen.bit,
                end: this.tempSelection.byte,
                endBit: this.tempSelection.bit
            });
        }
        else {
            this.setSelection({
                start: this.tempSelection.byte,
                startBit: this.tempSelection.bit,
                end: chosen.byte,
                endBit: chosen.bit
            });
        }
        this.tempSelection = null;
        this.cursor = chosen.byte;
        this.bit = chosen.bit;
        this.hexCursorChanged.emit({ byte: this.cursor, bit: this.bit });
        this.hexSelectionChanged.emit(this.selection);
        if (this.editController.isInProgress) {
            this.editController.commit();
            this.hexDataChanged.emit();
        }
    }
    render() {
        let out;
        if (this.displayAsChunks)
            out = this.showChunks();
        else
            out = this.showHex();
        return (h("div", { class: "fudgedit-container" }, out));
    }
    _toggleScrollListener(evt) {
        if (evt.type === "mouseenter")
            evt.target.addEventListener("wheel", this.scroll, { passive: false });
        else
            evt.target.removeEventListener("wheel", this.scroll, false);
    }
};
HexEditor.style = hexEditorCss;

const tooltipCss = "fudge-hex-tooltip{position:fixed;display:none;-webkit-box-sizing:border-box;box-sizing:border-box;font-size:14px;max-width:400px;padding:5px;border-radius:2px;background-color:#000;color:white;z-index:1000;pointer-events:none}fudge-hex-tooltip[active=true]{display:block;left:calc(var(--mouse-x) * 1px);top:calc(var(--mouse-y) * 1px);-webkit-transition:.2s left ease, .2s top ease;transition:.2s left ease, .2s top ease}";

const Tooltip = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.active = false;
    }
    render() {
        if (!this.active)
            return;
        const out = [];
        if (this.data) {
            let data = (typeof this.data === 'string') ? JSON.parse(this.data) : this.data;
            if (data.name)
                out.push(h("span", null, `name: ${data.name}`), h("br", null));
            out.push(h("span", null, `size: ${data.end - data.start} [0x${data.start.toString(16)} - 0x${data.end.toString(16)}]`), h("br", null));
            for (const [key, value] of Object.entries(data)) {
                if (['name', 'subRegions', 'start', 'end'].includes(key))
                    continue;
                if (value !== null) {
                    out.push(h("span", null, key, ": ", value), h("br", null));
                }
            }
        }
        else if (this.simpleText) {
            out.push(h("span", null, this.simpleText));
        }
        else {
            out.push(h("span", null, "placeholder"));
        }
        return out;
    }
};
Tooltip.style = tooltipCss;

export { HexEditor as fudge_hex_editor, Tooltip as fudge_hex_tooltip };
