var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
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
var Existing = /** @class */ (function () {
    function Existing(offset, length, modified, myType) {
        if (modified === void 0) { modified = 0; }
        this.offset = offset;
        this.length = length;
        this.modified = modified;
        this.myType = myType;
        this.self = this;
    }
    Existing.prototype.splitAt = function (position) {
        var left = this.makeNew(this.mOffset, position);
        var right = this.makeNew(this.offset + position, this.length - position, this.modified);
        if (left.length === 0) {
            this.self = [right];
            return [undefined, right];
        }
        if (right.mLength === 0) {
            this.self = [left];
            return [left, undefined];
        }
        return (this.self = [left, right]);
    };
    Existing.prototype.isContinuedBy = function (other) {
        if (other instanceof this.myType) {
            return this.mLength + this.mOffset === other.mOffset && this.editNum === other.editNum;
        }
        return false;
    };
    Existing.prototype.join = function (other) {
        return (this.self = this.makeNew(this.mOffset, this.mLength + other.mLength));
    };
    Object.defineProperty(Existing.prototype, "isSelf", {
        get: function () { return this === this.self; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Existing.prototype, "mOffset", {
        get: function () { return this.offset + this.modified; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Existing.prototype, "mLength", {
        get: function () { return this.length - this.modified; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Existing.prototype, "pieces", {
        get: function () {
            if (Array.isArray(this.self)) {
                if (this.self.length === 1)
                    return __spreadArrays(this.self[0].pieces);
                return __spreadArrays(this.self[0].pieces, this.self[1].pieces);
            }
            return [this.self];
        },
        enumerable: true,
        configurable: true
    });
    return Existing;
}());
var Original = /** @class */ (function (_super) {
    __extends(Original, _super);
    function Original(offset, length, modified) {
        if (modified === void 0) { modified = 0; }
        return _super.call(this, offset, length, modified, Original) || this;
    }
    Original.prototype.makeNew = function (offset, length, modified) {
        return new Original(offset, length, modified);
    };
    return Original;
}(Existing));
var Added = /** @class */ (function (_super) {
    __extends(Added, _super);
    function Added(offset, length, type, editNum, consumption, modified) {
        if (consumption === void 0) { consumption = []; }
        if (modified === void 0) { modified = 0; }
        var _this = _super.call(this, offset, length, modified, Added) || this;
        _this.type = type;
        _this.editNum = editNum;
        _this.consumption = consumption;
        return _this;
    }
    Added.prototype.makeNew = function (offset, length, modified) {
        return new Added(offset, length, this.type, this.editNum, this.consumption, modified);
    };
    return Added;
}(Existing));
var InProgress = /** @class */ (function () {
    function InProgress(offset, type, editNum, index) {
        this.offset = offset;
        this.type = type;
        this.editNum = editNum;
        this.index = index;
        this.content = [];
        this.consumption = [];
    }
    Object.defineProperty(InProgress.prototype, "length", {
        get: function () { return this.content.length; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InProgress.prototype, "modified", {
        get: function () { return 0; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InProgress.prototype, "mLength", {
        get: function () { return this.length; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InProgress.prototype, "mOffset", {
        get: function () { return this.offset; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InProgress.prototype, "pieces", {
        get: function () { return [this]; },
        enumerable: true,
        configurable: true
    });
    return InProgress;
}());
/**
 * controls the editing of values in the hex editor
 */
var EditController = /** @class */ (function () {
    function EditController(parent) {
        var _this = this;
        this.parent = parent;
        this.added = new Uint8Array();
        this.pieces = [];
        this.undoStack = [];
        this.redoStack = [];
        this.chunk = '';
        this.original = parent.file;
        this.pieces = [new Original(0, this.original.length)];
        window['rollback'] = function () {
            _this.rollback();
            console.log(_this.pieces);
        };
        window['ec'] = this;
    }
    EditController.prototype.initEdit = function (offset, type) {
        var _a;
        if (this.redoStack.length > 0)
            this.rollback();
        this.inProgress = new InProgress(this.added.length, type, this.undoStack.length + 1, -1);
        var _b = this.getPieceAtOffset(offset), targetIndex = _b.targetIndex, targetSlicePoint = _b.targetSlicePoint, target = _b.target;
        if (target instanceof Existing) {
            var splitParts = target.splitAt(targetSlicePoint);
            var toInsert = void 0;
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
            (_a = this.pieces).splice.apply(_a, __spreadArrays([targetIndex, 1], toInsert));
        }
        this.undoStack.push(this.inProgress);
    };
    /**
     * gets the piece at an offset
     * @param offset
     */
    EditController.prototype.getPieceAtOffset = function (offset) {
        var tracker = 0;
        var targetSlicePoint;
        var targetIndex;
        var target;
        for (var _i = 0, _a = this.pieces.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], i = _b[0], piece = _b[1];
            tracker += piece.mLength;
            if (tracker >= offset) {
                targetSlicePoint = piece.mLength - tracker + offset;
                targetIndex = i;
                target = piece;
                break;
            }
        }
        return {
            targetSlicePoint: targetSlicePoint,
            targetIndex: targetIndex,
            target: target
        };
    };
    Object.defineProperty(EditController.prototype, "isInProgress", {
        get: function () { return !!this.inProgress; },
        enumerable: true,
        configurable: true
    });
    /**
     * targets the piece next to the inProgress piece, if it exists, and
     * modifies its length/offset by amount if the inProgress type is
     * set to 'overwrite'.
     *
     * @param amount - the amount to modify the target piece's length by
     */
    EditController.prototype.modifyNextPiece = function (amount, index, piece) {
        var target = piece ? piece : this.inProgress;
        if (index !== this.pieces.length - 1) {
            var lastConsumption = last(target.consumption);
            if (lastConsumption === undefined || lastConsumption.consumed) {
                var nextPiece = this.pieces[index + 1];
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
    };
    EditController.prototype.find = function (searchArr, from, maxLength) {
        // Boyer-Moore string search algorithm:
        // https://en.wikipedia.org/wiki/Boyer%E2%80%93Moore_string-search_algorithm
        var results = [];
        var myChunk = this.render(from, maxLength ? maxLength : this.length - from).out;
        var inf = 0;
        for (var i = searchArr.length; i < myChunk.length; i++) {
            if (myChunk[i] === searchArr[searchArr.length - 1]) {
                for (var j = searchArr.length - 1; j >= 0; j--) {
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
                var searchIdx = searchArr.lastIndexOf(myChunk[i]);
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
    };
    EditController.prototype.redo = function () {
        var _a, _b;
        if (this.redoStack.length > 0) {
            var _c = this.redoStack.pop(), neighbor = _c[0], startMod = _c[1], toAdd = _c[2];
            var idx = this.pieces.indexOf(neighbor);
            // console.log(idx);
            if (toAdd.type === 'insert') {
                (_a = this.pieces).splice.apply(_a, __spreadArrays([idx, 0], toAdd.pieces));
            }
            else {
                var partialConsume = 0;
                var lp = last(toAdd.consumption);
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
                (_b = this.pieces).splice.apply(_b, __spreadArrays([idx, toAdd.consumption.length - partialConsume], toAdd.pieces));
            }
            this.undoStack.push(toAdd);
            forceUpdate(this.parent);
        }
    };
    EditController.prototype.undo = function () {
        var _a;
        if (this.isInProgress) {
            this.commit();
            this.chunk = '';
        }
        if (this.undoStack.length > 0) {
            // get the latest undo
            var target = this.undoStack.pop();
            // get the first piece of that undo step
            var targetIdx = this.pieces.indexOf(target.pieces[0]);
            var neighbor = void 0;
            var lastMod = NaN;
            // determine type of operation
            if (target instanceof Added && target.type === 'overwrite') {
                // if type was overwrite, then there are more steps necessary
                // due to the potential to consume other pieces,
                // all of which will need to be restored
                // restore all pieces that have been FULLY consumed
                // store those that have only been partially consumed
                var restored = [];
                var partiallyConsumed = [];
                for (var _i = 0, _b = target.consumption; _i < _b.length; _i++) {
                    var t = _b[_i];
                    if (t.consumed) {
                        t.piece.modified = t.startMod;
                        restored.push(t.piece);
                    }
                    else {
                        partiallyConsumed.push(t);
                    }
                }
                // put restored pieces back while removing target
                (_a = this.pieces).splice.apply(_a, __spreadArrays([targetIdx, target.pieces.length], restored));
                // store the neighbor
                neighbor = this.pieces[targetIdx];
                // due to not "rolling back" every undo, the stored piece might actually be multiple
                // pieces. This is kept track of with the piece's 'self' variable.
                if (partiallyConsumed.length) {
                    // store the modified value of the partially consumed piece for redo
                    if (!partiallyConsumed[0].piece.isSelf) {
                        var pieces = partiallyConsumed[0].piece.pieces;
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
    };
    // pressing backspace will be handled differently depending on:
    // whether something is in-progress, and whether the editingMode of the
    // parent is 'byte'/'ascii' or 'bit'
    EditController.prototype.backSpace = function () {
        if (this.inProgress) {
            this.chunk = '';
            this.inProgress.content.pop();
            this.parent.setCursorPosition(this.parent.cursor - 1);
            this.modifyNextPiece(1, this.inProgress.index);
        }
    };
    /**
     * builds the edit
     *
     * @param {KeyboardEvent} keyStroke
     * @memberof EditController
     */
    EditController.prototype.buildEdit = function (keyStroke) {
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
    };
    EditController.prototype.commit = function () {
        var newArr = new Uint8Array(this.added.length + this.inProgress.content.length);
        newArr.set(this.added, 0);
        newArr.set(this.inProgress.content, this.added.length);
        var newAddedPiece = new Added(newArr.length - this.inProgress.length, this.inProgress.length, this.inProgress.type, this.inProgress.editNum, this.inProgress.consumption);
        this.pieces[this.inProgress.index] = newAddedPiece;
        this.undoStack[this.undoStack.length - 1] = newAddedPiece;
        this.added = newArr;
        this.inProgress = null;
        this.chunk = '';
    };
    EditController.prototype.rollback = function () {
        var chopLength = 0;
        while (this.redoStack.length > 0) {
            chopLength += this.redoStack.pop()[2].length;
        }
        var newArr = new Uint8Array(this.added.length - chopLength);
        newArr.set(this.added.subarray(0, newArr.length), 0);
        this.added = newArr;
        for (var i = 0; i < this.pieces.length - 1; i++) {
            var p1 = this.pieces[i];
            var p2 = this.pieces[i + 1];
            if (p1.isContinuedBy(p2)) {
                this.pieces.splice(i, 2, p1.join(p2));
                i--;
            }
        }
    };
    EditController.prototype.render = function (start, length) {
        var out = new Uint8Array(length);
        var meta = { added: [] };
        var tracker = 0;
        var startPlace;
        var startIndex = 0;
        for (var _i = 0, _a = this.pieces.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], i = _b[0], piece = _b[1];
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
        var firstChunk = this.getPieceBuffer(this.pieces[startIndex]).subarray(startPlace, startPlace + length);
        tracker = firstChunk.length;
        out.set(firstChunk, 0);
        for (var i = startIndex + 1; i < this.pieces.length; i++) {
            var piece = this.pieces[i];
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
                meta: meta
            };
        }
        return {
            out: out,
            meta: meta
        };
    };
    Object.defineProperty(EditController.prototype, "length", {
        get: function () {
            var lengthCheck = 0;
            for (var _i = 0, _a = this.pieces; _i < _a.length; _i++) {
                var piece = _a[_i];
                lengthCheck += piece.length;
            }
            return lengthCheck;
        },
        enumerable: true,
        configurable: true
    });
    EditController.prototype.save = function () {
        return this.render(0, this.length).out;
    };
    EditController.prototype.getPieceBuffer = function (piece) {
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
    };
    return EditController;
}());
function floatToBin(value, size, endianness) {
    var exponentBitCount;
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
    var sign = (value < 0) ? 1 : 0;
    value = Math.abs(value);
    var fullNum = Math.floor(value);
    var decimal = value - fullNum;
    var decMantissaLimit = ((size * 8) - 1 - exponentBitCount) - fullNum.toString(2).length + 3;
    var decMantissa = '';
    for (var i = 0; i < decMantissaLimit; i++) {
        decimal *= 2;
        decMantissa += Math.floor(decimal);
        if (decimal >= 1)
            decimal -= 1;
    }
    var rounding = decMantissa.substring(decMantissa.length - 2);
    decMantissa = decMantissa.substring(0, decMantissa.length - 2);
    console.log(decMantissa, rounding);
    if (rounding.charAt(0) === '1') {
        decMantissa = (parseInt(decMantissa, 2) + 1).toString(2);
        if (/^10+$/.test(decMantissa)) {
            fullNum += 1;
            decMantissa = '';
        }
    }
    var exponent = fullNum.toString(2).length - 1 + (Math.pow(2, exponentBitCount) / 2 - 1);
    if (fullNum === 0) {
        if (decMantissa === '')
            exponent = 0;
        else
            exponent = (Math.pow(2, exponentBitCount) / 2 - 1) - decMantissa.match(/^(0*)/)[0].length - 1;
    }
    var expBin = exponent.toString(2).padStart(exponentBitCount, '0');
    var fullBin = sign +
        expBin +
        (fullNum.toString(2) + decMantissa).padEnd(((size * 8) - 1 - exponentBitCount) - fullNum.toString(2).length, '0').substring(1);
    console.log(sign, expBin, (fullNum.toString(2) + decMantissa).padEnd(((size * 8) - 1 - exponentBitCount) - fullNum.toString(2).length, '0').substring(1));
    var out = [];
    for (var i = 0; i < (size * 8); i += 8) {
        out.push(parseInt(fullBin.substring(i, i + 8), 2));
    }
    if (endianness === 'little')
        out.reverse();
    if (value === 0)
        out.fill(0);
    return out;
}
var hexEditorCss = ".fudgedit-container{overflow:hidden;position:relative;min-height:100%;color:black}.hex{font-family:'Sourcecode Pro', Courier, monospace;font-size:15px;height:100%;outline:none}.binView,.hexView,.asciiView,.lineLabels{display:inline-block;padding:0 10px;white-space:pre;position:relative}.binLine span,.hexLine span,.charLine span{position:relative;height:17px;display:inline-block}.lineLabel{height:17px}.binLine>span>span{position:relative;width:14px;padding:0 3px;-webkit-box-sizing:border-box;box-sizing:border-box}.binLine span{padding:0 0px}.binLine>span>span.padBit::after{background-color:#0006;position:absolute;width:1px;height:100%;left:calc(100% + 0.5px);content:''}.binLine>span>span:last-child.padBit::after{width:2px;left:100%}.binLine>span:last-child>span:last-child.padBit::after{display:none}.charLine span{width:10px}.hexLine span{position:relative;padding:0 5px;width:28px;-webkit-box-sizing:border-box;box-sizing:border-box}.hexLine span:not(:last-child).padByte::after{background-color:#0006;position:absolute;width:2px;height:100%;left:calc(100% - 1px);content:''}.binLine span,.hexLine span{cursor:default;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.binLine span.selected,.charLine span.selected,.hexLine span.selected{background-color:#8888FF80}.binLine span.cursor,.charLine span.cursor,.hexLine span.cursor{background-color:#008;color:#FFF}.binLine>span.added,.charLine span.added,.hexLine span.added{color:red}.binLine>span>span:hover,.charLine span:hover,.hexLine span:hover{background-color:#000;color:#FFF}.hexLine span.ASCII{font-weight:bold}.binLine:nth-child(2n-1),.hexLine:nth-child(2n-1),.charLine:nth-child(2n-1),.lineLabel:nth-child(2n-1){background-color:#EEFFFF;mix-blend-mode:multiply}.binLine.selected,.charLine.selected,.hexLine.selected,.lineLabel.selected{background-color:#FFA}.separator{opacity:0;pointer-events:none}.region{opacity:1}.highlight{mix-blend-mode:multiply}.region{position:relative}.highlight:hover .region:not(:hover){fill:#0003}.find{width:calc(100% - 20px);height:50px;position:absolute;bottom:0;left:0;right:0;margin:auto;background-color:#fff;z-index:4}";
var HexEditor = /** @class */ (function () {
    function class_1(hostRef) {
        var _this = this;
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
        this.scroll = function (evt) {
            evt.preventDefault();
            var scaledVelocity = (!Number.isInteger(evt.deltaY)) ? Math.ceil(evt.deltaY / 100) : Math.ceil(evt.deltaY / 2);
            if (scaledVelocity === -0)
                scaledVelocity -= 1;
            if (_this.lineNumber + scaledVelocity < 0)
                _this.lineNumber = 0;
            else if (_this.lineNumber + scaledVelocity > Math.floor(_this.editController.length / _this.bytesPerLine) - 1)
                _this.lineNumber = Math.floor(_this.editController.length / _this.bytesPerLine) - 1;
            else
                _this.lineNumber += scaledVelocity;
        };
        this.hexLineChanged = createEvent(this, "hexLineChanged", 7);
        this.hexCursorChanged = createEvent(this, "hexCursorChanged", 7);
        this.hexSelectionChanged = createEvent(this, "hexSelectionChanged", 7);
        this.hexDataChanged = createEvent(this, "hexDataChanged", 7);
        this.hexLoaded = createEvent(this, "hexLoaded", 7);
    }
    // !SECTION
    // SECTION COMPONENT LIFECYCLE METHODS
    class_1.prototype.componentWillLoad = function () {
        this.file = new Uint8Array(1024).map(function (_, i) { return i % 256; });
        this.editController = new EditController(this);
        this.regionScaleWidth = 28;
        this.regionScaleHeight = 17;
    };
    class_1.prototype.componentDidLoad = function () {
        this.hexLoaded.emit(this.editController);
    };
    // !SECTION
    // SECTION LISTENERS
    // !SECTION
    // SECTION EXPOSED API
    /**
    * accepts and reads the given file, storing the result in
    * the file variable
    * @param file
    */
    class_1.prototype.acceptFile = function (file) {
        return __awaiter(this, void 0, void 0, function () {
            var reader;
            var _this = this;
            return __generator(this, function (_a) {
                console.log(file);
                this.fileMetadata = file;
                reader = new FileReader();
                reader.readAsArrayBuffer(file);
                reader.onload = function (event) {
                    _this.file = new Uint8Array(event.target.result);
                    _this.editController = new EditController(_this);
                };
                return [2 /*return*/];
            });
        });
    };
    /**
     * returns the edited file
     *
     * @returns {(Promise<Uint8Array | void>)}
     * @memberof HexEditor
     */
    class_1.prototype.saveFile = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.file == undefined)
                    return [2 /*return*/];
                return [2 /*return*/, this.editController.save()];
            });
        });
    };
    /**
     * sets the line number
     *
     * @param {number} newLineNumber
     * @memberof HexEditor
     */
    class_1.prototype.setLineNumber = function (newLineNumber) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (newLineNumber < 0)
                    this.lineNumber = 0;
                else
                    this.lineNumber = newLineNumber;
                this.hexLineChanged.emit(this.lineNumber);
                return [2 /*return*/];
            });
        });
    };
    /**
     * sets the new cursor position
     *
     * @param {number} newCursorPosition
     * @memberof HexEditor
     */
    class_1.prototype.setCursorPosition = function (newCursorPosition, bit) {
        return __awaiter(this, void 0, void 0, function () {
            var adjustMain;
            return __generator(this, function (_a) {
                if (bit) {
                    adjustMain = 0;
                    if (bit >= 8)
                        adjustMain = Math.floor(bit / 8);
                    this.cursor = newCursorPosition + adjustMain;
                    this.bit = bit % 8;
                }
                else {
                    this.cursor = newCursorPosition;
                }
                this.hexCursorChanged.emit({ byte: this.cursor, bit: this.bit });
                return [2 /*return*/];
            });
        });
    };
    /**
     * sets the new selection bounds.
     * @param {{start?: number, end?: number}} newSelection
     * @memberof HexEditor
     */
    class_1.prototype.setSelection = function (newSelection) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.selection = Object.assign(Object.assign({}, this.selection), newSelection);
                this.hexSelectionChanged.emit(this.selection);
                return [2 /*return*/];
            });
        });
    };
    /**
     * fetches a Uint8Array of a given length
     * at the given location
     * @param location where to fetch the data from
     * @param length how many bytes to load
     * @memberof HexEditor
     */
    class_1.prototype.getChunk = function (location, length) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.editController.render(location, length)];
            });
        });
    };
    /**
     * returns the file's metadata
     * @memberof HexEditor
     */
    class_1.prototype.getFileMetadata = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.fileMetadata];
            });
        });
    };
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
    class_1.prototype.executeSearch = function (text, searchType, range, searchByteCount, searchEndian) {
        return __awaiter(this, void 0, void 0, function () {
            var searchArr;
            return __generator(this, function (_a) {
                try {
                    searchArr = this.formatSearch(text, searchType, searchByteCount, searchEndian);
                }
                catch (e) {
                    console.log(e);
                }
                this.searchResults = this.editController.find(searchArr, range ? range[0] : 0, range ? range[1] - range[0] : undefined);
                return [2 /*return*/, this.searchResults];
            });
        });
    };
    // !SECTION
    // LOCAL METHODS
    /**
     * builds the elements responsible for the hex view
     */
    class_1.prototype.buildHexView = function () {
        var _this = this;
        var _a = this, lineNumber = _a.lineNumber, maxLines = _a.maxLines, bytesPerLine = _a.bytesPerLine, bytesPerGroup = _a.bytesPerGroup, bitsPerGroup = _a.bitsPerGroup, asciiInline = _a.asciiInline;
        var start = lineNumber * bytesPerLine;
        var chunkData = this.editController.render(start, maxLines * bytesPerLine);
        var chunk = chunkData.out;
        var addedRanges = chunkData.meta.added;
        var lines = [];
        for (var i = 0; i < maxLines; i++) {
            lines.push(chunk.subarray(i * bytesPerLine, (i + 1) * bytesPerLine));
        }
        var binViews = [];
        var lineViews = [];
        var charViews = [];
        var selectedLine = -1;
        for (var _i = 0, _b = lines.entries(); _i < _b.length; _i++) {
            var _c = _b[_i], lineNum = _c[0], line = _c[1];
            if (line.length === 0)
                break;
            // setup variables
            var base = start + lineNum * bytesPerLine;
            var binLines = [];
            var charLines = [];
            var hexLines = [];
            var ascii = '•';
            // sets up everything else.
            for (var _d = 0, _e = __spreadArrays(line.values()).entries(); _d < _e.length; _d++) {
                var _f = _e[_d], position = _f[0], val = _f[1];
                var out = void 0;
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
                var classList = [];
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
                for (var _g = 0, addedRanges_1 = addedRanges; _g < addedRanges_1.length; _g++) {
                    var _h = addedRanges_1[_g], start_1 = _h[0], end = _h[1];
                    if (start_1 <= base + position && base + position < end) {
                        classList.push('added');
                        break;
                    }
                }
                // binary spans are more complicated than the others
                // they are split into 8 pieces (the 8 bits that make up a byte)
                var binArr = val.toString(2).padStart(8, '0').split('');
                var binSpans = [];
                if (this.displayBin) {
                    for (var i = 0; i < binArr.length; i++) {
                        var binClass = '';
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
        var lineLabels = [];
        for (var i = 0; i < maxLines; i++) {
            lineLabels.push(h("div", { class: 'lineLabel' + (selectedLine === i ? ' selected' : ''), style: { pointerEvents: 'none' } }, '0x' + (start + i * bytesPerLine).toString(16).padStart(8, ' ')));
        }
        // regions
        var binRegionMarkers = [];
        var hexRegionMarkers = [];
        var asciiRegionMarkers = [];
        var buildRegion = function (region, depth, index) {
            if (depth === void 0) { depth = 0; }
            if (region.end < start || region.start > start + _this.maxLines * _this.bytesPerLine) {
                if (region.subRegions && depth + 1 !== _this.regionDepth) {
                    for (var _i = 0, _a = region.subRegions.entries(); _i < _a.length; _i++) {
                        var _b = _a[_i], i = _b[0], r = _b[1];
                        buildRegion(r, depth + 1, i);
                    }
                }
                return;
            }
            if (depth === _this.regionDepth)
                return;
            // start / end offsets
            var s = region.start % _this.bytesPerLine;
            var e = region.end % _this.bytesPerLine;
            // l is the "height" of the region. It was a bit confusing, so allow me to explain:
            // instead of only taking into account the start and end of the region's offsets,
            // what we ACTUALLY want is the start and end while taking into account the offset
            // provided by 's'
            var l = Math.floor((region.end - region.start + s) / _this.bytesPerLine);
            var offset = Math.floor(region.start / _this.bytesPerLine) - lineNumber;
            var getColor = {
                0: ['#88F', '#BBF'],
                1: ['#F88', '#FBB'],
                2: ['#8D8', '#BDB']
            };
            var genPolygon = function (width, height) { return (h("polygon", { onMouseMove: function (evt) {
                    if (_this.canUpdateMouseMove === undefined) {
                        _this.canUpdateMouseMove = true;
                    }
                    if (_this.canUpdateMouseMove) {
                        _this.canUpdateMouseMove = false;
                        document.documentElement.style.setProperty('--mouse-x', "" + evt.clientX);
                        document.documentElement.style.setProperty('--mouse-y', "" + evt.clientY);
                        document.getElementById('tooltip').setAttribute('active', 'true');
                        document.getElementById('tooltip').setAttribute('complex', "" + JSON.stringify(Object.assign(Object.assign({}, region), { subRegions: region.subRegions ? region.subRegions.map(function (sr) { return sr.name; }) : null })));
                        setTimeout(function () { _this.canUpdateMouseMove = true; }, 50);
                    }
                }, onMouseLeave: function () { return document.getElementById('tooltip').setAttribute('active', 'false'); }, class: "region", points: "\n              0," + (1 + offset) * height + "\n              " + s * width + "," + (1 + offset) * height + "\n              " + s * width + "," + offset * height + "\n              " + _this.bytesPerLine * width + "," + offset * height + "\n              " + _this.bytesPerLine * width + "," + (l + offset) * height + "\n              " + e * width + "," + (l + offset) * height + "\n              " + e * width + "," + (l + offset + 1) * height + "\n              0," + (l + 1 + offset) * height + "\n            ", fill: region.color || getColor[depth % 3][index % 2], stroke: "none" })); };
            binRegionMarkers.push(genPolygon(14 * 8, _this.regionScaleHeight));
            hexRegionMarkers.push(genPolygon(_this.regionScaleWidth, _this.regionScaleHeight));
            asciiRegionMarkers.push(genPolygon(10, _this.regionScaleHeight));
            // if regions don't work right in the future then the if condition below is the reason why
            if (region.subRegions && depth + 1 !== _this.regionDepth) {
                for (var _c = 0, _d = region.subRegions.entries(); _c < _d.length; _c++) {
                    var _e = _d[_c], i = _e[0], r = _e[1];
                    buildRegion(r, depth + 1, i);
                }
            }
            // }
        };
        for (var _j = 0, _k = this.regions.entries(); _j < _k.length; _j++) {
            var _l = _k[_j], i = _l[0], region = _l[1];
            buildRegion(region, 0, i);
        }
        // style={{width: this.bytesPerLine * this.regionScaleWidth, height: this.maxLines * this.regionScaleHeight}}
        var binRegions = h("svg", { viewBox: "0 0 " + this.bytesPerLine * 14 * 8 + " " + this.maxLines * this.regionScaleHeight, width: "" + this.bytesPerLine * 14 * 8, height: "" + this.maxLines * this.regionScaleHeight }, binRegionMarkers);
        var hexRegions = h("svg", { viewBox: "0 0 " + this.bytesPerLine * this.regionScaleWidth + " " + this.maxLines * this.regionScaleHeight, width: "" + this.bytesPerLine * this.regionScaleWidth, height: "" + this.maxLines * this.regionScaleHeight }, hexRegionMarkers);
        var asciiRegions = h("svg", { viewBox: "0 0 " + this.bytesPerLine * 10 + " " + this.maxLines * this.regionScaleHeight, width: "" + this.bytesPerLine * 10, height: "" + this.maxLines * this.regionScaleHeight }, asciiRegionMarkers);
        return {
            lineViews: lineViews,
            charViews: charViews,
            binViews: binViews,
            lineLabels: lineLabels,
            binRegions: binRegions,
            hexRegions: hexRegions,
            asciiRegions: asciiRegions
        };
    };
    class_1.prototype.buildChunks = function () {
        var _this = this;
        var _a = this, lineNumber = _a.lineNumber, maxLines = _a.maxLines, bytesPerLine = _a.bytesPerLine, bytesPerGroup = _a.bytesPerGroup, chunks = _a.chunks, bitsPerGroup = _a.bitsPerGroup, asciiInline = _a.asciiInline;
        // console.log(lineNumber);
        var chunkOffset = {
            chunk: 0,
            chunkLineOffs: 0
        };
        // get offset data for the generated chunks
        for (var lNum = lineNumber, j = 0; lNum > 0 && j < chunks.length; lNum--, j++) {
            var acc = Math.floor((chunks[j].end - chunks[j].start) / bytesPerLine) + 1;
            lNum -= acc;
            if (lNum > 0)
                chunkOffset.chunk += 1;
            else
                chunkOffset.chunkLineOffs = acc - lNum * -1;
        }
        // render the chunks, rendering
        // only the parts that are visible
        var renderedChunks = [];
        for (var i = chunkOffset.chunk, lineCount = 0; lineCount < maxLines && i < chunks.length; i++) {
            var startLine = lineCount;
            var chunk = chunks[i];
            var actualStart = chunk.start;
            if (i == chunkOffset.chunk)
                actualStart += bytesPerLine * chunkOffset.chunkLineOffs;
            if (chunk.end - actualStart <= 0) {
                // renderedChunks.push({data: new Uint8Array(0), start: -1, startLine: -1, endLine: -1});
                continue;
            }
            lineCount += Math.ceil((chunk.end - actualStart) / bytesPerLine);
            var actualEnd = chunk.end;
            if (lineCount > maxLines)
                actualEnd -= (lineCount - maxLines) * bytesPerLine;
            // console.log(actualEnd - actualStart);
            var rendered = this.editController.render(actualStart, actualEnd - actualStart).out;
            renderedChunks.push({ start: actualStart, data: rendered, startLine: startLine, endLine: lineCount });
            for (var j = 0; j < 1; j++) {
                lineCount += 1;
                renderedChunks.push({ data: new Uint8Array(0), start: -1, startLine: -1, endLine: -1 });
            }
        }
        renderedChunks.pop();
        var lineViews = [];
        var charViews = [];
        var binViews = [];
        var lineLabels = [];
        var binRegionMarkers = [];
        var hexRegionMarkers = [];
        var asciiRegionMarkers = [];
        var _loop_1 = function (start, data, startLine) {
            if (start === -1) {
                lineLabels.push(h("div", { class: 'separator', style: { pointerEvents: 'none' } }, "NA"));
                lineViews.push(h("div", { class: 'separator', style: { pointerEvents: 'none' } }, "NA"));
                charViews.push(h("div", { class: 'separator', style: { pointerEvents: 'none' } }, "NA"));
                binViews.push(h("div", { class: 'separator', style: { pointerEvents: 'none' } }, "NA"));
                return "continue";
            }
            for (var i = 0; i < data.length; i += bytesPerLine) {
                var lineStart = start + i;
                var hexLine = [];
                var charLine = [];
                var binLine = [];
                var selectedLine = -1;
                for (var j = i; j < i + bytesPerLine && j < data.length; j++) {
                    var val = data[j];
                    var position = start + j;
                    var out = void 0;
                    var ascii = void 0;
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
                    var classList = [];
                    if (out.startsWith('.'))
                        classList.push('ASCII');
                    if ((j - i) % bytesPerGroup === bytesPerGroup - 1)
                        classList.push('padByte');
                    if (Math.floor(this_1.cursor) === position) {
                        classList.push('cursor');
                        selectedLine = lineStart;
                    }
                    if (this_1.selection && this_1.selection.start <= position && position <= this_1.selection.end)
                        classList.push('selected');
                    // binary spans are more complicated than the others
                    // they are split into 8 pieces (the 8 bits that make up a byte)
                    var binArr = val.toString(2).padStart(8, '0').split('');
                    var binSpans = [];
                    if (this_1.displayBin) {
                        for (var k = 0; k < binArr.length; k++) {
                            var binClass = '';
                            if ((position * 8 + k) % bitsPerGroup == bitsPerGroup - 1)
                                binClass += 'padBit';
                            if (classList.includes('cursor') && (this_1.bit === k || this_1.bit === -1))
                                binClass += ' cursor';
                            if (classList.includes('selected')) {
                                if (this_1.selection.start === this_1.selection.end) {
                                    if (k >= this_1.selection.startBit && k <= this_1.selection.endBit)
                                        binClass += ' selected';
                                }
                                else if (this_1.selection.start == position) {
                                    if (k >= this_1.selection.startBit)
                                        binClass += ' selected';
                                }
                                else if (this_1.selection.end == position) {
                                    if (k <= this_1.selection.endBit || this_1.selection.endBit === -1)
                                        binClass += ' selected';
                                }
                                else
                                    binClass += ' selected';
                            }
                            binSpans.push(h("span", { "data-cursor-idx": k, class: binClass }, binArr[k]));
                        }
                    }
                    if (this_1.displayBin)
                        binLine.push(h("span", { "data-cursor-idx": position, class: "binGroup" + (classList.includes('added') ? ' added' : '') }, binSpans));
                    if (this_1.displayAscii)
                        charLine.push(h("span", { "data-cursor-idx": position, class: classList.join(' ') }, ascii));
                    if (this_1.displayHex)
                        hexLine.push(h("span", { "data-cursor-idx": position, class: classList.join(' ') }, out));
                }
                lineLabels.push((h("div", { class: 'lineLabel' + (selectedLine === lineStart ? ' selected' : ''), style: { pointerEvents: 'none' } }, '0x' + (lineStart).toString(16).padStart(8, ' '))));
                if (this_1.displayBin)
                    binViews.push((h("div", { class: 'binLine' + (selectedLine === lineStart ? ' selected' : '') }, binLine)));
                if (this_1.displayHex) {
                    lineViews.push((h("div", { class: 'hexLine' + (selectedLine === lineStart ? ' selected' : '') }, hexLine)));
                }
                else {
                    lineViews.push({});
                }
                if (this_1.displayAscii)
                    charViews.push((h("div", { class: 'charLine' + (selectedLine === lineStart ? ' selected' : '') }, charLine)));
            }
            var buildRegion = function (region, depth, index) {
                if (depth === void 0) { depth = 0; }
                var lineCount = Math.floor(data.length / bytesPerLine);
                var horizOffset = start % bytesPerLine;
                if (region.end < start || region.start > start + lineCount * bytesPerLine) {
                    if (region.subRegions && depth + 1 !== _this.regionDepth) {
                        for (var _i = 0, _a = region.subRegions.entries(); _i < _a.length; _i++) {
                            var _b = _a[_i], i = _b[0], r = _b[1];
                            buildRegion(r, depth + 1, i);
                        }
                    }
                    return;
                }
                if (depth === _this.regionDepth)
                    return;
                var startByte = Math.max(region.start, start);
                var endByte = Math.min(region.end, start + data.length);
                var s = (startByte - horizOffset) % bytesPerLine;
                var e = (endByte - horizOffset) % bytesPerLine;
                var l = Math.floor((endByte - startByte + s) / bytesPerLine);
                var vertOffset = (Math.floor((startByte - start) / bytesPerLine) + startLine);
                // console.log(startLine)
                // console.log(idx, startByte.toString(16), vertOffset);
                var getColor = {
                    0: ['#88F', '#BBF'],
                    1: ['#F88', '#FBB'],
                    2: ['#8D8', '#BDB']
                };
                var genPolygon = function (width, height) { return (h("polygon", { onMouseMove: function (evt) {
                        if (_this.canUpdateMouseMove === undefined) {
                            _this.canUpdateMouseMove = true;
                        }
                        if (_this.canUpdateMouseMove) {
                            _this.canUpdateMouseMove = false;
                            document.documentElement.style.setProperty('--mouse-x', "" + evt.clientX);
                            document.documentElement.style.setProperty('--mouse-y', "" + evt.clientY);
                            document.getElementById('tooltip').setAttribute('active', 'true');
                            document.getElementById('tooltip').setAttribute('complex', "" + JSON.stringify(Object.assign(Object.assign({}, region), { subRegions: region.subRegions ? region.subRegions.map(function (sr) { return sr.name; }) : null })));
                            setTimeout(function () { _this.canUpdateMouseMove = true; }, 50);
                        }
                    }, onMouseLeave: function () { return document.getElementById('tooltip').setAttribute('active', 'false'); }, class: "region", points: "\n              0," + (1 + vertOffset) * height + "\n              " + s * width + "," + (1 + vertOffset) * height + "\n              " + s * width + "," + vertOffset * height + "\n              " + _this.bytesPerLine * width + "," + vertOffset * height + "\n              " + _this.bytesPerLine * width + "," + (l + vertOffset) * height + "\n              " + e * width + "," + (l + vertOffset) * height + "\n              " + e * width + "," + (l + vertOffset + 1) * height + "\n              0," + (l + 1 + vertOffset) * height + "\n            ", fill: region.color || getColor[depth % 3][index % 2], stroke: "none" })); };
                binRegionMarkers.push(genPolygon(14 * 8, _this.regionScaleHeight));
                hexRegionMarkers.push(genPolygon(_this.regionScaleWidth, _this.regionScaleHeight));
                asciiRegionMarkers.push(genPolygon(10, _this.regionScaleHeight));
                // if regions don't work right in the future then the if condition below is the reason why
                if (region.subRegions && depth + 1 !== _this.regionDepth) {
                    for (var _c = 0, _d = region.subRegions.entries(); _c < _d.length; _c++) {
                        var _e = _d[_c], i = _e[0], r = _e[1];
                        buildRegion(r, depth + 1, i);
                    }
                }
            };
            for (var _i = 0, _a = this_1.regions.entries(); _i < _a.length; _i++) {
                var _b = _a[_i], i = _b[0], region = _b[1];
                buildRegion(region, 0, i);
            }
        };
        var this_1 = this;
        for (var _i = 0, renderedChunks_1 = renderedChunks; _i < renderedChunks_1.length; _i++) {
            var _b = renderedChunks_1[_i], start = _b.start, data = _b.data, startLine = _b.startLine;
            _loop_1(start, data, startLine);
        }
        while (lineViews.length < maxLines) {
            lineLabels.push(h("div", { class: "separator" }, h("span", null, "-")));
            binViews.push(h("div", { class: "separator" }, h("span", null, "-")));
            lineViews.push(h("div", { class: "separator" }, h("span", null, "-")));
            charViews.push(h("div", { class: "separator" }, h("span", null, "-")));
        }
        var binRegions = h("svg", { viewBox: "0 0 " + this.bytesPerLine * 14 * 8 + " " + this.maxLines * this.regionScaleHeight, width: "" + this.bytesPerLine * 14 * 8, height: "" + this.maxLines * this.regionScaleHeight }, binRegionMarkers);
        var hexRegions = h("svg", { viewBox: "0 0 " + this.bytesPerLine * this.regionScaleWidth + " " + this.maxLines * this.regionScaleHeight, width: "" + this.bytesPerLine * this.regionScaleWidth, height: "" + this.maxLines * this.regionScaleHeight }, hexRegionMarkers);
        var asciiRegions = h("svg", { viewBox: "0 0 " + this.bytesPerLine * 10 + " " + this.maxLines * this.regionScaleHeight, width: "" + this.bytesPerLine * 10, height: "" + this.maxLines * this.regionScaleHeight }, asciiRegionMarkers);
        return {
            lineViews: lineViews,
            charViews: charViews,
            binViews: binViews,
            lineLabels: lineLabels,
            binRegions: binRegions,
            hexRegions: hexRegions,
            asciiRegions: asciiRegions
        };
    };
    /**
     * edits the underlying uint8array or
     * adjusts the cursor position
     *
     * @param {KeyboardEvent} evt
     * @returns
     * @memberof HexEditor
     */
    class_1.prototype.edit = function (evt) {
        var _this = this;
        if (evt.target.className !== 'hex')
            return;
        var evtArrowKeyConditions = {
            ArrowDown: function () {
                _this.setCursorPosition((_this.cursor + _this.bytesPerLine > _this.editController.length)
                    ? _this.editController.length
                    : _this.cursor + _this.bytesPerLine);
            },
            ArrowUp: function () { _this.setCursorPosition((_this.cursor - _this.bytesPerLine < 0) ? 0 : _this.cursor - _this.bytesPerLine); },
            ArrowRight: function () {
                _this.setCursorPosition((_this.cursor + 1 > _this.editController.length)
                    ? _this.editController.length
                    : _this.cursor + 1);
            },
            ArrowLeft: function () { _this.setCursorPosition((_this.cursor - 1 < 0) ? 0 : _this.cursor - 1); }
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
    };
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
    class_1.prototype.formatSearch = function (text, searchType, searchByteCount, searchEndian) {
        if (text.length === 0)
            throw new Error('LEN0: there needs to be something to search for...');
        switch (searchType) {
            case 'integer':
                var max = parseInt('0x' + new Array(searchByteCount + 1).join('FF'), 16);
                var v = parseInt(text);
                if (Math.abs(v) > max) {
                    v = max * Math.sign(v);
                }
                var out = v.toString(16).padStart(2 * searchByteCount, '0').match(/.{2}/g).map(function (v) { return parseInt(v, 16); });
                if (searchEndian === 'little')
                    out.reverse();
                return out;
            case 'float':
                return floatToBin(parseFloat(text), searchByteCount, searchEndian);
            case 'byte':
                if (/[^0-9a-f ,|;]/ig.test(text))
                    throw new Error('UC: Unexpected Character (must be exclusively 0-9 and a-f)');
                else {
                    return text.replace(/[ ,|;]/ig, '').match(/.{2}/g).map(function (v) { return parseInt(v, 16); });
                }
            case 'ascii':
            default:
                return text.split('').map(function (ch) { return ch.charCodeAt(0); });
        }
    };
    /**
     * triggers a find operation on the currently selected chunk
     * if there is one, otherwise it searches the full thing
     *
     * @memberof HexEditor
     */
    class_1.prototype.findInSelection = function () {
        return __awaiter(this, void 0, void 0, function () {
            var range, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        range = this.selection ? this.selection.end - this.selection.start : 0;
                        _a = this;
                        return [4 /*yield*/, this.executeSearch(this.searchInput, this.searchType, range === 0
                                ? undefined
                                : [this.selection.start, this.selection.end], this.searchByteCount, this.searchEndian)];
                    case 1:
                        _a.searchResults =
                            _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * displays the full hexidecimal view
     */
    class_1.prototype.showHex = function () {
        var _this = this;
        var _a = this.buildHexView(), lineViews = _a.lineViews, binViews = _a.binViews, charViews = _a.charViews, lineLabels = _a.lineLabels, binRegions = _a.binRegions, hexRegions = _a.hexRegions, asciiRegions = _a.asciiRegions;
        var searchHexDisplay;
        try {
            searchHexDisplay =
                this.formatSearch(this.searchInput, this.searchType, this.searchByteCount, this.searchEndian)
                    .map(function (v) { return v.toString(16).padStart(2, '0'); }).join(', ');
        }
        catch (e) {
            if (e.message.startsWith('LEN0'))
                searchHexDisplay = '';
            else
                searchHexDisplay = e.message;
        }
        var searchResults;
        if (this.searchActive) {
            var jumpToResult_1 = function (val) {
                var v = parseInt(val);
                _this.setCursorPosition(v);
                _this.setSelection({
                    start: v,
                    end: v + ((['integer', 'float'].includes(_this.searchType)) ? _this.searchByteCount : _this.searchInput.length) - 1,
                    startBit: -1,
                    endBit: -1
                });
                _this.setLineNumber(Math.floor(v / _this.bytesPerLine) - _this.maxLines / 2);
            };
            searchResults = (h("select", { onChange: function (evt) { return jumpToResult_1(evt.target.value); } }, this.searchResults.map(function (v) { return h("option", { value: v }, "0x" + v.toString(16)); })));
        }
        return (h("div", { class: "hex", onMouseEnter: function (evt) { return _this._toggleScrollListener(evt); }, onMouseLeave: function (evt) { return _this._toggleScrollListener(evt); }, onMouseDown: function (evt) { return _this.beginSelection(evt); }, onMouseUp: function (evt) { return _this.endSelection(evt); }, tabindex: "0", onKeyDown: function (evt) { return _this.edit(evt); } }, h("div", { id: "MEASURE", class: "hex", style: { position: 'absolute', visibility: 'hidden', padding: '0 5px' } }, "AB"), h("div", { class: "lineLabels" }, lineLabels), this.displayBin ?
            h("div", { class: "binView" }, h("div", { class: "highlight", style: { position: 'absolute', top: '0', display: this.mode === 'noregion' ? 'none' : 'block', zIndex: this.mode === 'region' ? '3' : '0' } }, binRegions), h("div", { class: "main" }, binViews))
            : null, this.displayHex ?
            h("div", { class: "hexView" }, h("div", { class: "highlight", style: { position: 'absolute', top: '0', display: this.mode === 'noregion' ? 'none' : 'block', zIndex: this.mode === 'region' ? '3' : '0' } }, hexRegions), h("div", { class: "main" }, lineViews))
            : null, this.displayAscii ?
            h("div", { class: "asciiView" }, h("div", { class: "highlight", style: { position: 'absolute', top: '0', display: this.mode === 'noregion' ? 'none' : 'block', zIndex: this.mode === 'region' ? '3' : '0' } }, asciiRegions), h("div", { class: "main" }, charViews))
            : null, this.searchActive ?
            h("div", { class: "find" }, "search:", h("input", { type: "text", onChange: function (evt) { return _this.searchInput = evt.target.value; } }), h("select", { onChange: function (evt) { return _this.searchType = evt.target.value; } }, h("option", { value: "ascii" }, "ASCII string"), h("option", { value: "byte" }, "bytes"), h("option", { value: "integer" }, "integer"), h("option", { value: "float" }, "float")), (['integer', 'float'].includes(this.searchType)) ? [
                h("select", { onChange: function (evt) { return _this.searchByteCount = parseInt(evt.target.value); } }, h("option", { value: "1" }, "1 byte"), h("option", { value: "2" }, "2 bytes"), h("option", { value: "4" }, "4 bytes"), h("option", { value: "8" }, "8 bytes")),
                h("select", { onChange: function (evt) { return _this.searchEndian = evt.target.value; } }, h("option", { value: "big" }, "big endian"), h("option", { value: "little" }, "little endian"))
            ]
                : null, h("button", { onClick: function () { return _this.findInSelection(); } }, "search"), h("br", null), "hex: ", searchHexDisplay, " | results: ", searchResults)
            : null));
    };
    /**
     * displays the chunks
     *
     * @memberof HexEditor
     */
    class_1.prototype.showChunks = function () {
        var _this = this;
        var _a = this.buildChunks(), lineViews = _a.lineViews, binViews = _a.binViews, charViews = _a.charViews, lineLabels = _a.lineLabels, binRegions = _a.binRegions, hexRegions = _a.hexRegions, asciiRegions = _a.asciiRegions;
        return (h("div", { class: "hex", onMouseEnter: function (evt) { return _this._toggleScrollListener(evt); }, onMouseLeave: function (evt) { return _this._toggleScrollListener(evt); }, onMouseDown: function (evt) { return _this.beginSelection(evt); }, onMouseUp: function (evt) { return _this.endSelection(evt); }, tabindex: "0", onKeyDown: function (evt) { return _this.edit(evt); } }, h("div", { id: "MEASURE", class: "hex", style: { position: 'absolute', visibility: 'hidden', padding: '0 5px' } }, "AB"), h("div", { class: "lineLabels" }, lineLabels), this.displayBin ?
            h("div", { class: "binView" }, h("div", { class: "highlight", style: { position: 'absolute', top: '0', display: this.mode === 'noregion' ? 'none' : 'block', zIndex: this.mode === 'region' ? '3' : '0' } }, binRegions), h("div", { class: "main" }, binViews))
            : null, this.displayHex ?
            h("div", { class: "hexView" }, h("div", { class: "highlight", style: { position: 'absolute', top: '0', display: this.mode === 'noregion' ? 'none' : 'block', zIndex: this.mode === 'region' ? '3' : '0' } }, hexRegions), h("div", { class: "main" }, lineViews))
            : null, this.displayAscii ?
            h("div", { class: "asciiView" }, h("div", { class: "highlight", style: { position: 'absolute', top: '0', display: this.mode === 'noregion' ? 'none' : 'block', zIndex: this.mode === 'region' ? '3' : '0' } }, asciiRegions), h("div", { class: "main" }, charViews))
            : null));
    };
    /**
     * gets the exact position of
     * @param evt the mousedown event
     */
    class_1.prototype.beginSelection = function (evt) {
        if (evt.target.id === 'HEX-SCROLLBAR')
            return;
        var parentClassName = evt.target.parentElement.className;
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
    };
    class_1.prototype.endSelection = function (evt) {
        if (this.tempSelection === null)
            return;
        var parentClassName = evt.target.parentElement.className;
        if (parentClassName.includes('charLine'))
            this.editingMode = 'ascii';
        else if (parentClassName.includes('hexLine'))
            this.editingMode = 'byte';
        else if (parentClassName.includes('binGroup'))
            this.editingMode = 'bit';
        else
            return;
        var chosen;
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
    };
    class_1.prototype.render = function () {
        var out;
        if (this.displayAsChunks)
            out = this.showChunks();
        else
            out = this.showHex();
        return (h("div", { class: "fudgedit-container" }, out));
    };
    class_1.prototype._toggleScrollListener = function (evt) {
        if (evt.type === "mouseenter")
            evt.target.addEventListener("wheel", this.scroll, { passive: false });
        else
            evt.target.removeEventListener("wheel", this.scroll, false);
    };
    return class_1;
}());
HexEditor.style = hexEditorCss;
var tooltipCss = "fudge-hex-tooltip{position:fixed;display:none;-webkit-box-sizing:border-box;box-sizing:border-box;font-size:14px;max-width:400px;padding:5px;border-radius:2px;background-color:#000;color:white;z-index:1000;pointer-events:none}fudge-hex-tooltip[active=true]{display:block;left:calc(var(--mouse-x) * 1px);top:calc(var(--mouse-y) * 1px);-webkit-transition:.2s left ease, .2s top ease;transition:.2s left ease, .2s top ease}";
var Tooltip = /** @class */ (function () {
    function Tooltip(hostRef) {
        registerInstance(this, hostRef);
        this.active = false;
    }
    Tooltip.prototype.render = function () {
        if (!this.active)
            return;
        var out = [];
        if (this.data) {
            var data = (typeof this.data === 'string') ? JSON.parse(this.data) : this.data;
            if (data.name)
                out.push(h("span", null, "name: " + data.name), h("br", null));
            out.push(h("span", null, "size: " + (data.end - data.start) + " [0x" + data.start.toString(16) + " - 0x" + data.end.toString(16) + "]"), h("br", null));
            for (var _i = 0, _a = Object.entries(data); _i < _a.length; _i++) {
                var _b = _a[_i], key = _b[0], value = _b[1];
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
    };
    return Tooltip;
}());
Tooltip.style = tooltipCss;
export { HexEditor as fudge_hex_editor, Tooltip as fudge_hex_tooltip };
