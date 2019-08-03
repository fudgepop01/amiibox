const h = window.fudgeapps.h;

function isInprogress(piece) {
    if (piece && piece.content)
        return true;
    else
        return false;
}
class EditController {
    constructor(parent) {
        this.parent = parent;
        this.added = new Uint8Array();
        this.pieces = [];
        this.chunk = '';
        this.original = parent.file;
        this.pieces = [{ offset: 0, length: this.original.length, source: "origin" }];
    }
    initEdit(offset, type) {
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
    }
    buildEdit(keyStroke) {
        if (/^[a-fA-F0-9]$/.test(keyStroke.key)) {
            this.chunk += keyStroke.key;
            if (this.chunk.length === 2) {
                this.inProgress.content.push(parseInt(this.chunk, 16));
                this.chunk = '';
                this.parent.setCursorPosition(this.parent.cursor + 1);
                let index = this.pieces.indexOf(this.inProgress);
                if (this.inProgress.type === 'overwrite' && index !== this.pieces.length - 1) {
                    const nextPiece = this.pieces[index + 1];
                    nextPiece.offset += 1;
                    nextPiece.length -= 1;
                    if (nextPiece.length === 0) {
                        this.pieces.splice(index + 1, 1);
                    }
                }
            }
        }
    }
    commit() {
        let newArr = new Uint8Array(this.added.length + this.inProgress.content.length);
        newArr.set(this.added, 0);
        newArr.set(this.inProgress.content, this.added.length);
        this.pieces[this.inProgress.index] = { offset: this.added.length, length: this.inProgress.length, source: 'added' };
        this.added = newArr;
        this.inProgress = null;
        this.chunk = '';
    }
    render(start, length) {
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
    }
    get length() {
        let lengthCheck = 0;
        for (const piece of this.pieces) {
            lengthCheck += piece.length;
        }
        return lengthCheck;
    }
    rollback() {
    }
    save() {
        return this.render(0, this.length).out;
    }
    getPieceBuffer(piece) {
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
    }
}

class HexEditor {
    constructor() {
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
    }
    // !SECTION
    // SECTION COMPONENT LIFECYCLE METHODS
    componentWillLoad() {
        this.file = new Uint8Array(32);
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
        this.lineNumber = newLineNumber;
        this.hexLineChanged.emit(newLineNumber);
    }
    /**
     * sets the new cursor position
     *
     * @param {number} newCursorPosition
     * @memberof HexEditor
     */
    async setCursorPosition(newCursorPosition) {
        this.cursor = newCursorPosition;
    }
    /**
     * sets the new selection bounds.
     * @param {{start?: number, end?: number}} newSelection
     * @memberof HexEditor
     */
    async setSelection(newSelection) {
        this.selection = Object.assign({}, this.selection, newSelection);
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
    // !SECTION
    // LOCAL METHODS
    /**
     * builds the elements responsible for the hex view
     */
    buildHexView() {
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
    }
    edit(evt) {
        if (this.editType === 'readonly')
            return;
        const editController = this.editController;
        if (!editController.inProgress)
            editController.initEdit(this.cursor, this.editType);
        editController.buildEdit(evt);
    }
    /**
     * displays the full hexidecimal view
     */
    showHex() {
        const { lineViews, charViews, lineLabels, regionMarkers } = this.buildHexView();
        return (h("div", { class: "hex", onMouseEnter: (evt) => this._toggleScrollListener(evt), onMouseLeave: (evt) => this._toggleScrollListener(evt), onMouseDown: (evt) => this.beginSelection(evt), onMouseUp: (evt) => this.endSelection(evt), tabindex: "0", onKeyDown: (evt) => this.edit(evt) },
            h("div", { id: "MEASURE", class: "hex", style: { position: 'absolute', visibility: 'hidden', padding: '0 5px' } }, "AB"),
            h("div", { class: "lineLabels" }, lineLabels),
            h("div", { class: "hexView" },
                h("div", { class: "highlight", style: { position: 'absolute', top: '0', display: this.mode === 'noregion' ? 'none' : 'block', zIndex: this.mode === 'region' ? '3' : '0' } }, regionMarkers),
                h("div", { class: "main" }, lineViews)),
            this.displayAscii ?
                h("div", { class: "asciiView" }, charViews)
                : null));
    }
    /**
     * gets the exact position of
     * @param evt the mousedown event
     */
    beginSelection(evt) {
        if (evt.target.id === 'HEX-SCROLLBAR')
            return;
        this.tempSelection =
            this.lineNumber * this.bytesPerLine +
                [...evt.composedPath()[2].children].indexOf(evt.composedPath()[1]) * this.bytesPerLine +
                [...evt.composedPath()[1].children].indexOf(evt.composedPath()[0]);
    }
    endSelection(evt) {
        if (evt.target.id === 'HEX-SCROLLBAR')
            return;
        const chosen = this.lineNumber * this.bytesPerLine +
            [...evt.composedPath()[2].children].indexOf(evt.composedPath()[1]) * this.bytesPerLine +
            [...evt.composedPath()[1].children].indexOf(evt.composedPath()[0]);
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
    }
    render() {
        return (h("div", { class: "fudgedit-container" }, this.showHex()));
    }
    _toggleScrollListener(evt) {
        if (evt.type === "mouseenter")
            evt.target.addEventListener("wheel", this.scroll, { passive: false });
        else
            evt.target.removeEventListener("wheel", this.scroll, false);
    }
    static get is() { return "fudge-hex-editor"; }
    static get properties() { return {
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
    }; }
    static get events() { return [{
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
        }]; }
    static get style() { return ".fudgedit-container {\n  overflow: hidden;\n  position: relative;\n  min-height: 100%;\n  color: black;\n}\n\n.hex {\n  font-family: 'Sourcecode Pro', Courier, monospace;\n  font-size: 15px;\n  height: 100%;\n  outline: none;\n}\n\n.hexView,\n.asciiView,\n.lineLabels {\n  display: inline-block;\n  padding: 0 10px;\n  white-space: pre;\n  position: relative;\n}\n\n.hexLine span,\n.charLine span {\n  position: relative;\n  height: 17px;\n  display: inline-block;\n}\n\n.lineLabel {\n  height: 17px;\n}\n\n.hexLine span {\n  position: relative;\n  padding: 0 5px;\n  width: 28px;\n  -webkit-box-sizing: border-box;\n  box-sizing: border-box;\n}\n.hexLine span:not(:last-child).padByte::after {\n  /* padding-right: 15px; */\n  background-color: #0006;\n  position: absolute;\n  width: 2px;\n  height: 100%;\n  left: calc(100% - 1px);\n  content: '';\n}\n\n.hexLine span {\n  cursor: default;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n}\n\n.charLine span.selected,\n.hexLine span.selected {\n  background-color: #8888FF80;\n}\n\n.charLine span.cursor,\n.hexLine span.cursor {\n  background-color: #008;\n  color: #FFF;\n}\n\n.charLine span.added,\n.hexLine span.added {\n  color: red;\n}\n\n.hexLine span:hover {\n  background-color: #000;\n  color: #FFF;\n}\n\n.hexLine:nth-child(2n-1),\n.charLine:nth-child(2n-1),\n.lineLabel:nth-child(2n-1) {\n  background-color: #EEFFFF;\n}\n\n.charLine.selected,\n.hexLine.selected {\n  background-color: #FFA;\n}\n\n.region { opacity: 1; }\n\n.highlight { mix-blend-mode: multiply; }\n\n.region {\n  position: relative;\n}\n\n.highlight:hover  .region:not(:hover) {\n  fill: #0003;\n}"; }
}

export { HexEditor as FudgeHexEditor };
