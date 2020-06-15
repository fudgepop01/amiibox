import { Component, State, Prop, Method, Event, h, forceUpdate } from '@stencil/core';
import { EditController } from './editController';
import { floatToBin } from './floatConverter';
export class HexEditor {
    constructor() {
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
            binViews.push(h("div", { class: "binLine", style: { pointerEvents: 'none' } },
                h("span", null, "-")));
            lineViews.push(h("div", { class: "hexLine", style: { pointerEvents: 'none' } },
                h("span", null, "-")));
            charViews.push(h("div", { class: "charLine", style: { pointerEvents: 'none' } },
                h("span", null, "-")));
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
            ;
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
                ;
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
            lineLabels.push(h("div", { class: "separator" },
                h("span", null, "-")));
            binViews.push(h("div", { class: "separator" },
                h("span", null, "-")));
            lineViews.push(h("div", { class: "separator" },
                h("span", null, "-")));
            charViews.push(h("div", { class: "separator" },
                h("span", null, "-")));
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
        return (h("div", { class: "hex", onMouseEnter: (evt) => this._toggleScrollListener(evt), onMouseLeave: (evt) => this._toggleScrollListener(evt), onMouseDown: (evt) => this.beginSelection(evt), onMouseUp: (evt) => this.endSelection(evt), tabindex: "0", onKeyDown: (evt) => this.edit(evt) },
            h("div", { id: "MEASURE", class: "hex", style: { position: 'absolute', visibility: 'hidden', padding: '0 5px' } }, "AB"),
            h("div", { class: "lineLabels" }, lineLabels),
            this.displayBin ?
                h("div", { class: "binView" },
                    h("div", { class: "highlight", style: { position: 'absolute', top: '0', display: this.mode === 'noregion' ? 'none' : 'block', zIndex: this.mode === 'region' ? '3' : '0' } }, binRegions),
                    h("div", { class: "main" }, binViews))
                : null,
            this.displayHex ?
                h("div", { class: "hexView" },
                    h("div", { class: "highlight", style: { position: 'absolute', top: '0', display: this.mode === 'noregion' ? 'none' : 'block', zIndex: this.mode === 'region' ? '3' : '0' } }, hexRegions),
                    h("div", { class: "main" }, lineViews))
                : null,
            this.displayAscii ?
                h("div", { class: "asciiView" },
                    h("div", { class: "highlight", style: { position: 'absolute', top: '0', display: this.mode === 'noregion' ? 'none' : 'block', zIndex: this.mode === 'region' ? '3' : '0' } }, asciiRegions),
                    h("div", { class: "main" }, charViews))
                : null,
            this.searchActive ?
                h("div", { class: "find" },
                    "search:",
                    h("input", { type: "text", onChange: (evt) => this.searchInput = evt.target.value }),
                    h("select", { onChange: (evt) => this.searchType = evt.target.value },
                        h("option", { value: "ascii" }, "ASCII string"),
                        h("option", { value: "byte" }, "bytes"),
                        h("option", { value: "integer" }, "integer"),
                        h("option", { value: "float" }, "float")),
                    (['integer', 'float'].includes(this.searchType)) ? [
                        h("select", { onChange: (evt) => this.searchByteCount = parseInt(evt.target.value) },
                            h("option", { value: "1" }, "1 byte"),
                            h("option", { value: "2" }, "2 bytes"),
                            h("option", { value: "4" }, "4 bytes"),
                            h("option", { value: "8" }, "8 bytes")),
                        h("select", { onChange: (evt) => this.searchEndian = evt.target.value },
                            h("option", { value: "big" }, "big endian"),
                            h("option", { value: "little" }, "little endian"))
                    ]
                        : null,
                    h("button", { onClick: () => this.findInSelection() }, "search"),
                    h("br", null),
                    "hex: ",
                    searchHexDisplay,
                    " | results: ",
                    searchResults)
                : null));
    }
    /**
     * displays the chunks
     *
     * @memberof HexEditor
     */
    showChunks() {
        const { lineViews, binViews, charViews, lineLabels, binRegions, hexRegions, asciiRegions } = this.buildChunks();
        return (h("div", { class: "hex", onMouseEnter: (evt) => this._toggleScrollListener(evt), onMouseLeave: (evt) => this._toggleScrollListener(evt), onMouseDown: (evt) => this.beginSelection(evt), onMouseUp: (evt) => this.endSelection(evt), tabindex: "0", onKeyDown: (evt) => this.edit(evt) },
            h("div", { id: "MEASURE", class: "hex", style: { position: 'absolute', visibility: 'hidden', padding: '0 5px' } }, "AB"),
            h("div", { class: "lineLabels" }, lineLabels),
            this.displayBin ?
                h("div", { class: "binView" },
                    h("div", { class: "highlight", style: { position: 'absolute', top: '0', display: this.mode === 'noregion' ? 'none' : 'block', zIndex: this.mode === 'region' ? '3' : '0' } }, binRegions),
                    h("div", { class: "main" }, binViews))
                : null,
            this.displayHex ?
                h("div", { class: "hexView" },
                    h("div", { class: "highlight", style: { position: 'absolute', top: '0', display: this.mode === 'noregion' ? 'none' : 'block', zIndex: this.mode === 'region' ? '3' : '0' } }, hexRegions),
                    h("div", { class: "main" }, lineViews))
                : null,
            this.displayAscii ?
                h("div", { class: "asciiView" },
                    h("div", { class: "highlight", style: { position: 'absolute', top: '0', display: this.mode === 'noregion' ? 'none' : 'block', zIndex: this.mode === 'region' ? '3' : '0' } }, asciiRegions),
                    h("div", { class: "main" }, charViews))
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
    static get is() { return "fudge-hex-editor"; }
    static get originalStyleUrls() { return {
        "$": ["hex-editor.css"]
    }; }
    static get styleUrls() { return {
        "$": ["hex-editor.css"]
    }; }
    static get properties() { return {
        "displayAscii": {
            "type": "boolean",
            "mutable": false,
            "complexType": {
                "original": "boolean",
                "resolved": "boolean",
                "references": {}
            },
            "required": false,
            "optional": false,
            "docs": {
                "tags": [{
                        "text": "{boolean}",
                        "name": "type"
                    }, {
                        "text": "HexEditor",
                        "name": "memberof"
                    }],
                "text": "weather or not to display ASCII on the side"
            },
            "attribute": "display-ascii",
            "reflect": false,
            "defaultValue": "true"
        },
        "displayHex": {
            "type": "boolean",
            "mutable": false,
            "complexType": {
                "original": "boolean",
                "resolved": "boolean",
                "references": {}
            },
            "required": false,
            "optional": false,
            "docs": {
                "tags": [{
                        "text": "{boolean}",
                        "name": "type"
                    }, {
                        "text": "HexEditor",
                        "name": "memberof"
                    }],
                "text": "weather or not to display Hex"
            },
            "attribute": "display-hex",
            "reflect": false,
            "defaultValue": "true"
        },
        "displayBin": {
            "type": "boolean",
            "mutable": false,
            "complexType": {
                "original": "boolean",
                "resolved": "boolean",
                "references": {}
            },
            "required": false,
            "optional": false,
            "docs": {
                "tags": [{
                        "text": "{boolean}",
                        "name": "type"
                    }, {
                        "text": "HexEditor",
                        "name": "memberof"
                    }],
                "text": "weather or not to display binary"
            },
            "attribute": "display-bin",
            "reflect": false,
            "defaultValue": "false"
        },
        "maxLines": {
            "type": "number",
            "mutable": false,
            "complexType": {
                "original": "number",
                "resolved": "number",
                "references": {}
            },
            "required": false,
            "optional": false,
            "docs": {
                "tags": [{
                        "text": "{number}",
                        "name": "type"
                    }, {
                        "text": "HexEditor",
                        "name": "memberof"
                    }],
                "text": "the number of lines to display at once"
            },
            "attribute": "max-lines",
            "reflect": false,
            "defaultValue": "30"
        },
        "bytesPerLine": {
            "type": "number",
            "mutable": false,
            "complexType": {
                "original": "number",
                "resolved": "number",
                "references": {}
            },
            "required": false,
            "optional": false,
            "docs": {
                "tags": [{
                        "text": "{number}",
                        "name": "type"
                    }, {
                        "text": "HexEditor",
                        "name": "memberof"
                    }],
                "text": "the number of bytes to display per line"
            },
            "attribute": "bytes-per-line",
            "reflect": false,
            "defaultValue": "16"
        },
        "chunks": {
            "type": "unknown",
            "mutable": false,
            "complexType": {
                "original": "{\r\n    title?: string;\r\n    start: number;\r\n    end: number;\r\n  }[]",
                "resolved": "{ title?: string; start: number; end: number; }[]",
                "references": {}
            },
            "required": false,
            "optional": false,
            "docs": {
                "tags": [{
                        "text": "{number[]}",
                        "name": "type"
                    }, {
                        "text": "HexEditor",
                        "name": "memberof"
                    }],
                "text": "definitions for each chunk to display when\r\ndisplayAsChunks is enabled"
            },
            "defaultValue": "[]"
        },
        "displayAsChunks": {
            "type": "boolean",
            "mutable": false,
            "complexType": {
                "original": "boolean",
                "resolved": "boolean",
                "references": {}
            },
            "required": false,
            "optional": false,
            "docs": {
                "tags": [{
                        "text": "{boolean}",
                        "name": "type"
                    }, {
                        "text": "HexEditor",
                        "name": "memberof"
                    }],
                "text": "displays the file as chunks (defined above)"
            },
            "attribute": "display-as-chunks",
            "reflect": false,
            "defaultValue": "false"
        },
        "asciiInline": {
            "type": "boolean",
            "mutable": false,
            "complexType": {
                "original": "boolean",
                "resolved": "boolean",
                "references": {}
            },
            "required": false,
            "optional": false,
            "docs": {
                "tags": [{
                        "text": "{boolean}",
                        "name": "type"
                    }, {
                        "text": "HexEditor",
                        "name": "memberof"
                    }],
                "text": "weather or not to replace typical ASCII values\r\nwith their ASCII value representation\r\n( ex: 0x61 ==> \".a\" )"
            },
            "attribute": "ascii-inline",
            "reflect": false,
            "defaultValue": "false"
        },
        "bytesPerGroup": {
            "type": "number",
            "mutable": false,
            "complexType": {
                "original": "number",
                "resolved": "number",
                "references": {}
            },
            "required": false,
            "optional": false,
            "docs": {
                "tags": [{
                        "text": "{number}",
                        "name": "type"
                    }, {
                        "text": "HexEditor",
                        "name": "memberof"
                    }],
                "text": "the number of chunks between separators"
            },
            "attribute": "bytes-per-group",
            "reflect": false,
            "defaultValue": "4"
        },
        "bitsPerGroup": {
            "type": "number",
            "mutable": false,
            "complexType": {
                "original": "number",
                "resolved": "number",
                "references": {}
            },
            "required": false,
            "optional": false,
            "docs": {
                "tags": [{
                        "text": "{number}",
                        "name": "type"
                    }, {
                        "text": "HexEditor",
                        "name": "memberof"
                    }],
                "text": "the number of bits between separators\r\non the bit display"
            },
            "attribute": "bits-per-group",
            "reflect": false,
            "defaultValue": "8"
        },
        "mode": {
            "type": "string",
            "mutable": false,
            "complexType": {
                "original": "\"region\" | \"select\" | \"noregion\"",
                "resolved": "\"noregion\" | \"region\" | \"select\"",
                "references": {}
            },
            "required": false,
            "optional": false,
            "docs": {
                "tags": [{
                        "text": "{(\"region\" | \"edit\" | \"noregion\")}",
                        "name": "type"
                    }, {
                        "text": "HexEditor",
                        "name": "memberof"
                    }],
                "text": "the mode of operation:\r\nregion:\r\n    used to highlight different regions. Hovering over\r\n    a region displays a tooltip\r\nedit:\r\n    regions are displayed in the background, allowing\r\n    the user to edit directly\r\nnoregion:\r\n    regions are not displayed at all"
            },
            "attribute": "mode",
            "reflect": false,
            "defaultValue": "\"select\""
        },
        "editType": {
            "type": "string",
            "mutable": false,
            "complexType": {
                "original": "\"insert\" | \"overwrite\" | \"readonly\"",
                "resolved": "\"insert\" | \"overwrite\" | \"readonly\"",
                "references": {}
            },
            "required": false,
            "optional": false,
            "docs": {
                "tags": [{
                        "text": "{(\"insert\" | \"overwrite\" | \"readonly\")}",
                        "name": "type"
                    }, {
                        "text": "HexEditor",
                        "name": "memberof"
                    }],
                "text": "the mode of data entry:\r\ninsert:\r\n    inserts data between bytes\r\noverwrite:\r\n    overwrites the currently selected byte\r\nreadonly:\r\n    no edits are possible"
            },
            "attribute": "edit-type",
            "reflect": false,
            "defaultValue": "\"readonly\""
        },
        "regionDepth": {
            "type": "number",
            "mutable": false,
            "complexType": {
                "original": "number",
                "resolved": "number",
                "references": {}
            },
            "required": false,
            "optional": false,
            "docs": {
                "tags": [{
                        "text": "{number}",
                        "name": "type"
                    }, {
                        "text": "HexEditor",
                        "name": "memberof"
                    }],
                "text": "the number of regions to traverse"
            },
            "attribute": "region-depth",
            "reflect": false,
            "defaultValue": "2"
        },
        "regions": {
            "type": "unknown",
            "mutable": false,
            "complexType": {
                "original": "IRegion[]",
                "resolved": "IRegion[]",
                "references": {
                    "IRegion": {
                        "location": "import",
                        "path": "./interfaces"
                    }
                }
            },
            "required": false,
            "optional": false,
            "docs": {
                "tags": [{
                        "text": "{IRegion[]}",
                        "name": "type"
                    }, {
                        "text": "HexEditor",
                        "name": "memberof"
                    }],
                "text": "the region data. Data will be displayed in the tooltip\r\nif mode is set to \"region\""
            },
            "defaultValue": "[]"
        }
    }; }
    static get states() { return {
        "fileMetadata": {},
        "file": {},
        "lineNumber": {},
        "selection": {},
        "cursor": {},
        "bit": {},
        "editingMode": {},
        "searchType": {},
        "searchByteCount": {},
        "searchEndian": {},
        "searchInput": {},
        "searchResults": {},
        "searchActive": {}
    }; }
    static get events() { return [{
            "method": "hexLineChanged",
            "name": "hexLineChanged",
            "bubbles": true,
            "cancelable": true,
            "composed": true,
            "docs": {
                "tags": [{
                        "text": "{EventEmitter}",
                        "name": "type"
                    }, {
                        "text": "HexEditor",
                        "name": "memberof"
                    }],
                "text": "Emitted when the lineNumber changes"
            },
            "complexType": {
                "original": "any",
                "resolved": "any",
                "references": {}
            }
        }, {
            "method": "hexCursorChanged",
            "name": "hexCursorChanged",
            "bubbles": true,
            "cancelable": true,
            "composed": true,
            "docs": {
                "tags": [{
                        "text": "{EventEmitter}",
                        "name": "type"
                    }, {
                        "text": "HexEditor",
                        "name": "memberof"
                    }],
                "text": "Emitted on the change of the cursor's position"
            },
            "complexType": {
                "original": "any",
                "resolved": "any",
                "references": {}
            }
        }, {
            "method": "hexSelectionChanged",
            "name": "hexSelectionChanged",
            "bubbles": true,
            "cancelable": true,
            "composed": true,
            "docs": {
                "tags": [{
                        "text": "{EventEmitter}",
                        "name": "type"
                    }, {
                        "text": "HexEditor",
                        "name": "memberof"
                    }],
                "text": "Emitted when the selection changes"
            },
            "complexType": {
                "original": "any",
                "resolved": "any",
                "references": {}
            }
        }, {
            "method": "hexDataChanged",
            "name": "hexDataChanged",
            "bubbles": true,
            "cancelable": true,
            "composed": true,
            "docs": {
                "tags": [{
                        "text": "{EventEmitter}",
                        "name": "type"
                    }, {
                        "text": "HexEditor",
                        "name": "memberof"
                    }],
                "text": "fired when the file's data changes"
            },
            "complexType": {
                "original": "any",
                "resolved": "any",
                "references": {}
            }
        }, {
            "method": "hexLoaded",
            "name": "hexLoaded",
            "bubbles": true,
            "cancelable": true,
            "composed": true,
            "docs": {
                "tags": [],
                "text": "fired when the component loads"
            },
            "complexType": {
                "original": "any",
                "resolved": "any",
                "references": {}
            }
        }]; }
    static get methods() { return {
        "acceptFile": {
            "complexType": {
                "signature": "(file: File) => Promise<void>",
                "parameters": [{
                        "tags": [{
                                "text": "file",
                                "name": "param"
                            }],
                        "text": ""
                    }],
                "references": {
                    "Promise": {
                        "location": "global"
                    },
                    "File": {
                        "location": "global"
                    }
                },
                "return": "Promise<void>"
            },
            "docs": {
                "text": "accepts and reads the given file, storing the result in\r\nthe file variable",
                "tags": [{
                        "name": "param",
                        "text": "file"
                    }]
            }
        },
        "saveFile": {
            "complexType": {
                "signature": "() => Promise<void | Uint8Array>",
                "parameters": [],
                "references": {
                    "Promise": {
                        "location": "global"
                    },
                    "Uint8Array": {
                        "location": "global"
                    }
                },
                "return": "Promise<void | Uint8Array>"
            },
            "docs": {
                "text": "returns the edited file",
                "tags": [{
                        "name": "returns",
                        "text": undefined
                    }, {
                        "name": "memberof",
                        "text": "HexEditor"
                    }]
            }
        },
        "setLineNumber": {
            "complexType": {
                "signature": "(newLineNumber: number) => Promise<void>",
                "parameters": [{
                        "tags": [{
                                "text": "newLineNumber",
                                "name": "param"
                            }],
                        "text": ""
                    }],
                "references": {
                    "Promise": {
                        "location": "global"
                    }
                },
                "return": "Promise<void>"
            },
            "docs": {
                "text": "sets the line number",
                "tags": [{
                        "name": "param",
                        "text": "newLineNumber"
                    }, {
                        "name": "memberof",
                        "text": "HexEditor"
                    }]
            }
        },
        "setCursorPosition": {
            "complexType": {
                "signature": "(newCursorPosition: number, bit?: number) => Promise<void>",
                "parameters": [{
                        "tags": [{
                                "text": "newCursorPosition",
                                "name": "param"
                            }],
                        "text": ""
                    }, {
                        "tags": [],
                        "text": ""
                    }],
                "references": {
                    "Promise": {
                        "location": "global"
                    }
                },
                "return": "Promise<void>"
            },
            "docs": {
                "text": "sets the new cursor position",
                "tags": [{
                        "name": "param",
                        "text": "newCursorPosition"
                    }, {
                        "name": "memberof",
                        "text": "HexEditor"
                    }]
            }
        },
        "setSelection": {
            "complexType": {
                "signature": "(newSelection: { start?: number; end?: number; startBit?: number; endBit?: number; }) => Promise<void>",
                "parameters": [{
                        "tags": [{
                                "text": "newSelection",
                                "name": "param"
                            }],
                        "text": ""
                    }],
                "references": {
                    "Promise": {
                        "location": "global"
                    }
                },
                "return": "Promise<void>"
            },
            "docs": {
                "text": "sets the new selection bounds.",
                "tags": [{
                        "name": "param",
                        "text": "newSelection"
                    }, {
                        "name": "memberof",
                        "text": "HexEditor"
                    }]
            }
        },
        "getChunk": {
            "complexType": {
                "signature": "(location: number, length: number) => Promise<{ out: Uint8Array; meta: { added: [number, number][]; }; }>",
                "parameters": [{
                        "tags": [{
                                "text": "location where to fetch the data from",
                                "name": "param"
                            }],
                        "text": "where to fetch the data from"
                    }, {
                        "tags": [{
                                "text": "length how many bytes to load",
                                "name": "param"
                            }],
                        "text": "how many bytes to load"
                    }],
                "references": {
                    "Promise": {
                        "location": "global"
                    },
                    "Uint8Array": {
                        "location": "global"
                    }
                },
                "return": "Promise<{ out: Uint8Array; meta: { added: [number, number][]; }; }>"
            },
            "docs": {
                "text": "fetches a Uint8Array of a given length\r\nat the given location",
                "tags": [{
                        "name": "param",
                        "text": "location where to fetch the data from"
                    }, {
                        "name": "param",
                        "text": "length how many bytes to load"
                    }, {
                        "name": "memberof",
                        "text": "HexEditor"
                    }]
            }
        },
        "getFileMetadata": {
            "complexType": {
                "signature": "() => Promise<File>",
                "parameters": [],
                "references": {
                    "Promise": {
                        "location": "global"
                    },
                    "File": {
                        "location": "global"
                    }
                },
                "return": "Promise<File>"
            },
            "docs": {
                "text": "returns the file's metadata",
                "tags": [{
                        "name": "memberof",
                        "text": "HexEditor"
                    }]
            }
        },
        "executeSearch": {
            "complexType": {
                "signature": "(text: string, searchType: \"ascii\" | \"byte\" | \"integer\" | \"float\", range?: [number, number], searchByteCount?: 2 | 1 | 4 | 8, searchEndian?: \"big\" | \"little\") => Promise<number[]>",
                "parameters": [{
                        "tags": [{
                                "text": "text",
                                "name": "param"
                            }],
                        "text": ""
                    }, {
                        "tags": [{
                                "text": "searchType",
                                "name": "param"
                            }],
                        "text": ""
                    }, {
                        "tags": [{
                                "text": "range",
                                "name": "param"
                            }],
                        "text": ""
                    }, {
                        "tags": [{
                                "text": "searchByteCount",
                                "name": "param"
                            }],
                        "text": ""
                    }, {
                        "tags": [{
                                "text": "searchEndian",
                                "name": "param"
                            }],
                        "text": ""
                    }],
                "references": {
                    "Promise": {
                        "location": "global"
                    }
                },
                "return": "Promise<number[]>"
            },
            "docs": {
                "text": "executes a search in the currently loaded file with the supplied parameters",
                "tags": [{
                        "name": "param",
                        "text": "text"
                    }, {
                        "name": "param",
                        "text": "searchType"
                    }, {
                        "name": "param",
                        "text": "range"
                    }, {
                        "name": "param",
                        "text": "searchByteCount"
                    }, {
                        "name": "param",
                        "text": "searchEndian"
                    }, {
                        "name": "memberof",
                        "text": "HexEditor"
                    }]
            }
        }
    }; }
}
