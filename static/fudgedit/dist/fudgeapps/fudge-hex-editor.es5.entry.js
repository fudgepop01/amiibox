var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
fudgeapps.loadBundle('fudge-hex-editor', ['exports'], function (exports) {
    var h = window.fudgeapps.h;
    function isInprogress(piece) {
        if (piece && piece.content)
            return true;
        else
            return false;
    }
    var EditController = /** @class */ (function () {
        function EditController(parent) {
            this.parent = parent;
            this.added = new Uint8Array();
            this.pieces = [];
            this.chunk = '';
            this.original = parent.file;
            this.pieces = [{ offset: 0, length: this.original.length, source: "origin" }];
        }
        EditController.prototype.initEdit = function (offset, type) {
            this.inProgress = { offset, type, content: [], index: -1, get length() { return this.content.length; } };
            if (type === 'insert') {
                let tracker = 0;
                let targetSlicePoint;
                let targetIndex;
                let target;
                for (const [i, piece] of this.pieces.entries()) {
                    tracker += piece.length;
                    if (tracker >= offset) {
                        targetSlicePoint = piece.length - tracker + offset;
                        targetIndex = i;
                        target = piece;
                        break;
                    }
                }
                this.inProgress.index = targetIndex + 1;
                const toInsert = [
                    { offset: target.offset, length: targetSlicePoint, source: target.source },
                    this.inProgress,
                    { offset: target.offset + targetSlicePoint, length: target.length - targetSlicePoint, source: target.source },
                ];
                this.pieces.splice(targetIndex, 1, ...toInsert);
            }
            else {
                let tracker = 0;
                let targetSlicePoint;
                let targetIndex;
                let target;
                for (const [i, piece] of this.pieces.entries()) {
                    tracker += piece.length;
                    if (tracker >= offset) {
                        targetSlicePoint = piece.length - tracker + offset;
                        targetIndex = i;
                        target = piece;
                        break;
                    }
                }
                this.inProgress.index = targetIndex + 1;
                const toInsert = [
                    { offset: target.offset, length: targetSlicePoint, source: target.source },
                    this.inProgress,
                    { offset: target.offset + targetSlicePoint, length: target.length - targetSlicePoint, source: target.source },
                ];
                this.pieces.splice(targetIndex, 1, ...toInsert);
            }
        };
        EditController.prototype.buildEdit = function (keyStroke) {
            if (/^[a-fA-F0-9]$/.test(keyStroke.key)) {
                this.chunk += keyStroke.key;
                if (this.chunk.length === 2) {
                    this.inProgress.content.push(parseInt(this.chunk, 16));
                    this.chunk = '';
                    this.parent.setCursorPosition(this.parent.cursor + 1);
                    var index = this.pieces.indexOf(this.inProgress);
                    if (this.inProgress.type === 'overwrite' && index !== this.pieces.length - 1) {
                        var nextPiece = this.pieces[index + 1];
                        nextPiece.offset += 1;
                        nextPiece.length -= 1;
                        if (nextPiece.length === 0) {
                            this.pieces.splice(index + 1, 1);
                        }
                    }
                }
            }
        };
        EditController.prototype.commit = function () {
            var newArr = new Uint8Array(this.added.length + this.inProgress.content.length);
            newArr.set(this.added, 0);
            newArr.set(this.inProgress.content, this.added.length);
            this.pieces[this.inProgress.index] = { offset: this.added.length, length: this.inProgress.length, source: 'added' };
            this.added = newArr;
            this.inProgress = null;
            this.chunk = '';
        };
        EditController.prototype.render = function (start, length) {
            let out = new Uint8Array(length);
            let meta = { added: [] };
            let tracker = 0;
            let startPlace;
            let startIndex = 0;
            for (const [i, piece] of this.pieces.entries()) {
                tracker += piece.length;
                if (tracker >= start) {
                    startPlace = piece.length - tracker + start;
                    startIndex = i;
                    break;
                }
            }
            if (isInprogress(this.pieces[startIndex]) || this.pieces[startIndex].source === 'added') {
                meta.added.push([start - startPlace, start - startPlace + this.pieces[startIndex].length]);
            }
            let firstChunk = this.getPieceBuffer(this.pieces[startIndex]).subarray(startPlace, startPlace + length);
            tracker = firstChunk.length;
            out.set(firstChunk, 0);
            for (let i = startIndex + 1; i < this.pieces.length; i++) {
                let piece = this.pieces[i];
                tracker += piece.length;
                if (isInprogress(piece) || piece.source === 'added') {
                    meta.added.push([start + tracker - piece.length, start + tracker]);
                }
                if (tracker >= length) {
                    out.set(this.getPieceBuffer(piece).subarray(0, piece.length - tracker + length), tracker - piece.length);
                    break;
                }
                out.set(this.getPieceBuffer(piece), tracker - piece.length);
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
        EditController.prototype.rollback = function () {
        };
        EditController.prototype.save = function () {
            return this.render(0, this.length).out;
        };
        EditController.prototype.getPieceBuffer = function (piece) {
            if (isInprogress(piece)) {
                return new Uint8Array(piece.content);
            }
            // implied else
            if (piece.source === 'origin') {
                return this.original.subarray(piece.offset, piece.offset + piece.length);
            }
            else {
                return this.added.subarray(piece.offset, piece.offset + piece.length);
            }
        };
        return EditController;
    }());
    var HexEditor = /** @class */ (function () {
        function HexEditor() {
            var _this = this;
            // keeps track of which line is displayed
            this.lineNumber = 0;
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
             * currently does nothing
             * it WOULD force a line break every X bytes
             * @type {number}
             * @memberof HexEditor
             * @deprecated
             */
            this.bytesUntilForcedLine = 0;
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
             * the number of bytes between separators
             *
             * @type {number}
             * @memberof HexEditor
             */
            this.bytesPerGroup = 4;
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
            this.mode = "edit";
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
            this.editType = "overwrite";
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
        }
        // !SECTION
        // SECTION COMPONENT LIFECYCLE METHODS
        HexEditor.prototype.componentWillLoad = function () {
            this.file = new Uint8Array(32);
            this.editController = new EditController(this);
            this.regionScaleWidth = 28;
            this.regionScaleHeight = 17;
        };
        HexEditor.prototype.componentDidLoad = function () {
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
        HexEditor.prototype.acceptFile = function (file) {
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
        HexEditor.prototype.saveFile = function () {
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
        HexEditor.prototype.setLineNumber = function (newLineNumber) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    this.lineNumber = newLineNumber;
                    this.hexLineChanged.emit(newLineNumber);
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
        HexEditor.prototype.setCursorPosition = function (newCursorPosition) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    this.cursor = newCursorPosition;
                    return [2 /*return*/];
                });
            });
        };
        /**
         * sets the new selection bounds.
         * @param {{start?: number, end?: number}} newSelection
         * @memberof HexEditor
         */
        HexEditor.prototype.setSelection = function (newSelection) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    this.selection = Object.assign({}, this.selection, newSelection);
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
        HexEditor.prototype.getChunk = function (location, length) {
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
        HexEditor.prototype.getFileMetadata = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.fileMetadata];
                });
            });
        };
        // !SECTION
        // LOCAL METHODS
        /**
         * builds the elements responsible for the hex view
         */
        HexEditor.prototype.buildHexView = function () {
            const { lineNumber, maxLines, bytesPerLine, bytesPerGroup, /* bytesUntilForcedLine, */ asciiInline } = this;
            const start = lineNumber * bytesPerLine;
            const chunkData = this.editController.render(start, maxLines * bytesPerLine);
            const chunk = chunkData.out;
            const addedRanges = chunkData.meta.added;
            const lines = [];
            for (let i = 0; i < maxLines; i++) {
                lines.push(chunk.subarray(i * bytesPerLine, (i + 1) * bytesPerLine));
            }
            const lineViews = [];
            const charViews = [];
            for (const [lineNum, line] of lines.entries()) {
                if (line.length === 0)
                    break;
                // setup variables
                const base = start + lineNum * bytesPerLine;
                const charLines = [];
                const hexLines = [];
                let ascii = '•';
                let selected = false;
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
                    if (position % bytesPerGroup === bytesPerGroup - 1)
                        classList.push('padByte');
                    if (this.cursor === base + position) {
                        classList.push('cursor');
                        selected = true;
                    }
                    if (this.selection && this.selection.start <= base + position && base + position <= this.selection.end)
                        classList.push('selected');
                    for (const [start, end] of addedRanges) {
                        if (start <= base + position && base + position < end) {
                            classList.push('added');
                            break;
                        }
                    }
                    charLines.push(h("span", { class: classList.join(' ') }, ascii));
                    hexLines.push(h("span", { class: classList.join(' ') }, out));
                }
                lineViews.push((h("div", { class: 'hexLine' + (selected ? ' selected' : '') }, hexLines)));
                charViews.push((h("div", { class: 'charLine' + (selected ? ' selected' : '') }, charLines)));
            }
            // fill extra space
            while (lineViews.length < maxLines) {
                lineViews.push(h("div", { class: "hexLine", style: { pointerEvents: 'none' } },
                    h("span", null, "-")));
                charViews.push(h("div", { class: "charLine", style: { pointerEvents: 'none' } },
                    h("span", null, "-")));
            }
            // line number builder
            const lineLabels = [];
            for (let i = 0; i < maxLines; i++) {
                lineLabels.push(h("div", { class: "lineLabel", style: { pointerEvents: 'none' } }, '0x' + (start + i * bytesPerLine).toString(16).padStart(8, ' ')));
            }
            // regions
            const regionMarkers = [];
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
                // else {
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
                regionMarkers.push((h("polygon", { onmousemove: `
                if (window.canUpdateMousemove === undefined) {
                window.canUpdateMousemove = true;
                }
                if (window.canUpdateMousemove) {
                window.canUpdateMousemove = false;
                document.documentElement.style.setProperty('--mouse-x', event.clientX);
                document.documentElement.style.setProperty('--mouse-y', event.clientY);
                document.getElementById('tooltip').setAttribute('active', true)
                document.getElementById('tooltip').setAttribute('complex', '${JSON.stringify(Object.assign({}, region, { subRegions: region.subRegions ? region.subRegions.map(sr => sr.name) : null }))}');

                setTimeout(() => {window.canUpdateMousemove = true}, 50);
                }
            `, onmouseleave: `document.getElementById('tooltip').setAttribute('active', false)`, class: "region", points: `
                0,${(1 + offset) * this.regionScaleHeight}
                ${s * this.regionScaleWidth},${(1 + offset) * this.regionScaleHeight}
                ${s * this.regionScaleWidth},${offset * this.regionScaleHeight}
                ${this.bytesPerLine * this.regionScaleWidth},${offset * this.regionScaleHeight}
                ${this.bytesPerLine * this.regionScaleWidth},${(l + offset) * this.regionScaleHeight}
                ${e * this.regionScaleWidth},${(l + offset) * this.regionScaleHeight}
                ${e * this.regionScaleWidth},${(l + offset + 1) * this.regionScaleHeight}
                0,${(l + 1 + offset) * this.regionScaleHeight}
                `, fill: region.color || getColor[depth % 3][index % 2], stroke: "none" })));
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
            return {
                lineViews,
                charViews,
                lineLabels,
                regionMarkers: h("svg", { viewbox: `0 0 ${this.bytesPerLine * this.regionScaleWidth} ${this.maxLines * this.regionScaleHeight}`, width: `${this.bytesPerLine * this.regionScaleWidth}`, height: `${this.maxLines * this.regionScaleHeight}` }, regionMarkers)
            };
        };
        HexEditor.prototype.edit = function (evt) {
            if (this.editType === 'readonly')
                return;
            var editController = this.editController;
            if (!editController.inProgress)
                editController.initEdit(this.cursor, this.editType);
            editController.buildEdit(evt);
        };
        /**
         * displays the full hexidecimal view
         */
        HexEditor.prototype.showHex = function () {
            var _this = this;
            var _a = this.buildHexView(), lineViews = _a.lineViews, charViews = _a.charViews, lineLabels = _a.lineLabels, regionMarkers = _a.regionMarkers;
            return (h("div", { class: "hex", onMouseEnter: function (evt) { return _this._toggleScrollListener(evt); }, onMouseLeave: function (evt) { return _this._toggleScrollListener(evt); }, onMouseDown: function (evt) { return _this.beginSelection(evt); }, onMouseUp: function (evt) { return _this.endSelection(evt); }, tabindex: "0", onKeyDown: function (evt) { return _this.edit(evt); } }, h("div", { id: "MEASURE", class: "hex", style: { position: 'absolute', visibility: 'hidden', padding: '0 5px' } }, "AB"), h("div", { class: "lineLabels" }, lineLabels), h("div", { class: "hexView" }, h("div", { class: "highlight", style: { position: 'absolute', top: '0', display: this.mode === 'noregion' ? 'none' : 'block', zIndex: this.mode === 'region' ? '3' : '0' } }, regionMarkers), h("div", { class: "main" }, lineViews)), this.displayAscii ?
                h("div", { class: "asciiView" }, charViews)
                : null));
        };
        /**
         * gets the exact position of
         * @param evt the mousedown event
         */
        HexEditor.prototype.beginSelection = function (evt) {
            if (evt.target.id === 'HEX-SCROLLBAR')
                return;
            this.tempSelection =
                this.lineNumber * this.bytesPerLine +
                    [...evt.path[2].children].indexOf(evt.path[1]) * this.bytesPerLine +
                    [...evt.path[1].children].indexOf(evt.path[0]);
        };
        HexEditor.prototype.endSelection = function (evt) {
            if (evt.target.id === 'HEX-SCROLLBAR')
                return;
            var chosen = this.lineNumber * this.bytesPerLine +
                [...evt.path[2].children].indexOf(evt.path[1]) * this.bytesPerLine +
                [...evt.path[1].children].indexOf(evt.path[0]);
            if (this.tempSelection > chosen) {
                this.selection = {
                    start: chosen,
                    end: this.tempSelection,
                };
            }
            else {
                this.selection = {
                    start: this.tempSelection,
                    end: chosen,
                };
            }
            this.tempSelection = null;
            this.cursor = chosen;
            this.hexCursorChanged.emit(this.cursor);
            this.hexSelectionChanged.emit(this.selection);
            if (this.editController.inProgress) {
                this.editController.commit();
                this.hexDataChanged.emit();
            }
        };
        HexEditor.prototype.render = function () {
            return (h("div", { class: "fudgedit-container" }, this.showHex()));
        };
        HexEditor.prototype._toggleScrollListener = function (evt) {
            if (evt.type === "mouseenter")
                evt.target.addEventListener("wheel", this.scroll, { passive: false });
            else
                evt.target.removeEventListener("wheel", this.scroll, false);
        };
        Object.defineProperty(HexEditor, "is", {
            get: function () { return "fudge-hex-editor"; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HexEditor, "properties", {
            get: function () {
                return {
                    "acceptFile": {
                        "method": true
                    },
                    "asciiInline": {
                        "type": Boolean,
                        "attr": "ascii-inline"
                    },
                    "bytesPerGroup": {
                        "type": Number,
                        "attr": "bytes-per-group"
                    },
                    "bytesPerLine": {
                        "type": Number,
                        "attr": "bytes-per-line"
                    },
                    "bytesUntilForcedLine": {
                        "type": Number,
                        "attr": "bytes-until-forced-line"
                    },
                    "cursor": {
                        "state": true
                    },
                    "displayAscii": {
                        "type": Boolean,
                        "attr": "display-ascii"
                    },
                    "editType": {
                        "type": String,
                        "attr": "edit-type"
                    },
                    "file": {
                        "state": true
                    },
                    "fileMetadata": {
                        "state": true
                    },
                    "getChunk": {
                        "method": true
                    },
                    "getFileMetadata": {
                        "method": true
                    },
                    "lineNumber": {
                        "state": true
                    },
                    "maxLines": {
                        "type": Number,
                        "attr": "max-lines"
                    },
                    "mode": {
                        "type": String,
                        "attr": "mode"
                    },
                    "regionDepth": {
                        "type": Number,
                        "attr": "region-depth"
                    },
                    "regions": {
                        "type": "Any",
                        "attr": "regions"
                    },
                    "saveFile": {
                        "method": true
                    },
                    "selection": {
                        "state": true
                    },
                    "setCursorPosition": {
                        "method": true
                    },
                    "setLineNumber": {
                        "method": true
                    },
                    "setSelection": {
                        "method": true
                    }
                };
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HexEditor, "events", {
            get: function () {
                return [{
                        "name": "hexLineChanged",
                        "method": "hexLineChanged",
                        "bubbles": true,
                        "cancelable": true,
                        "composed": true
                    }, {
                        "name": "hexCursorChanged",
                        "method": "hexCursorChanged",
                        "bubbles": true,
                        "cancelable": true,
                        "composed": true
                    }, {
                        "name": "hexSelectionChanged",
                        "method": "hexSelectionChanged",
                        "bubbles": true,
                        "cancelable": true,
                        "composed": true
                    }, {
                        "name": "hexDataChanged",
                        "method": "hexDataChanged",
                        "bubbles": true,
                        "cancelable": true,
                        "composed": true
                    }, {
                        "name": "hexLoaded",
                        "method": "hexLoaded",
                        "bubbles": true,
                        "cancelable": true,
                        "composed": true
                    }];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HexEditor, "style", {
            get: function () { return ".fudgedit-container {\n  overflow: hidden;\n  position: relative;\n  min-height: 100%;\n  color: black;\n}\n\n.hex {\n  font-family: 'Sourcecode Pro', Courier, monospace;\n  font-size: 15px;\n  height: 100%;\n  outline: none;\n}\n\n.hexView,\n.asciiView,\n.lineLabels {\n  display: inline-block;\n  padding: 0 10px;\n  white-space: pre;\n  position: relative;\n}\n\n.hexLine span,\n.charLine span {\n  position: relative;\n  height: 17px !important;\n  display: inline-block;\n}\n\n.lineLabel {\n  height: 17px;\n}\n\n.hexLine,.charLine{height:17px!important;}\n\n.hexLine span {\n  position: relative;\n  height: 17px !important;\n  padding: 0 5px;\n  width: 28px;\n  -webkit-box-sizing: border-box;\n  box-sizing: border-box;\n}\n.hexLine span:not(:last-child).padByte::after {\n  /* padding-right: 15px; */\n  background-color: #0006;\n  position: absolute;\n  width: 2px;\n  height: 100%;\n  left: calc(100% - 1px);\n  content: '';\n}\n\n.hexLine span {\n  cursor: default;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n}\n\n.charLine span.selected,\n.hexLine span.selected {\n  background-color: #8888FF80;\n}\n\n.charLine span.cursor,\n.hexLine span.cursor {\n  background-color: #008;\n  color: #FFF;\n}\n\n.charLine span.added,\n.hexLine span.added {\n  color: red;\n}\n\n.hexLine span:hover {\n  background-color: #000;\n  color: #FFF;\n}\n\n.hexLine:nth-child(2n-1),\n.charLine:nth-child(2n-1),\n.lineLabel:nth-child(2n-1) {\n  background-color: #EEFFFF;\n}\n\n.charLine.selected,\n.hexLine.selected {\n  background-color: #FFA;\n}\n\n.region { opacity: 1; }\n\n.highlight { mix-blend-mode: multiply; }\n\n.region {\n  position: relative;\n}\n\n.highlight:hover  .region:not(:hover) {\n  fill: #0003;\n}"; },
            enumerable: true,
            configurable: true
        });
        return HexEditor;
    }());
    exports.FudgeHexEditor = HexEditor;
    Object.defineProperty(exports, '__esModule', { value: true });
});
