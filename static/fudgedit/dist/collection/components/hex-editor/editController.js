import { forceUpdate } from '@stencil/core';
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
export class EditController {
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
        else if (this.parent.editingMode === 'bit') {
        }
        else {
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
                ;
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
