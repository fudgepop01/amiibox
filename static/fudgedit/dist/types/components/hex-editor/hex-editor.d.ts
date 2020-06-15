import { EventEmitter } from '../../stencil-public-runtime';
import { EditController } from './editController';
import { IRegion } from './interfaces';
export declare class HexEditor {
    editController: EditController;
    regionScaleWidth: number;
    regionScaleHeight: number;
    canUpdateMouseMove: boolean;
    /**
     * contains metadata of the given file
     * @type {File}
     * @memberof HexEditor
     */
    fileMetadata: File;
    /**
     * the loaded file
     *
     * @type {Uint8Array}
     * @memberof HexEditor
     */
    file: Uint8Array;
    lineNumber: number;
    tempSelection: {
        byte: number;
        bit: number;
    };
    selection: {
        start: number;
        startBit: number;
        end: number;
        endBit: number;
    };
    cursor: number;
    bit: number;
    editingMode: 'ascii' | 'byte' | 'bit';
    searchType: 'ascii' | 'byte' | 'integer' | 'float';
    searchByteCount: 1 | 2 | 4 | 8;
    searchEndian: 'big' | 'little';
    searchInput: string;
    searchResults: number[];
    searchActive: boolean;
    /**
     * weather or not to display ASCII on the side
     *
     * @type {boolean}
     * @memberof HexEditor
     */
    displayAscii: boolean;
    /**
     * weather or not to display Hex
     *
     * @type {boolean}
     * @memberof HexEditor
     */
    displayHex: boolean;
    /**
     * weather or not to display binary
     *
     * @type {boolean}
     * @memberof HexEditor
     */
    displayBin: boolean;
    /**
     * the number of lines to display at once
     *
     * @type {number}
     * @memberof HexEditor
     */
    maxLines: number;
    /**
     * the number of bytes to display per line
     *
     * @type {number}
     * @memberof HexEditor
     */
    bytesPerLine: number;
    /**
     * definitions for each chunk to display when
     * displayAsChunks is enabled
     *
     * @type {number[]}
     * @memberof HexEditor
     */
    chunks: {
        title?: string;
        start: number;
        end: number;
    }[];
    /**
     * displays the file as chunks (defined above)
     *
     * @type {boolean}
     * @memberof HexEditor
     */
    displayAsChunks: boolean;
    /**
     * weather or not to replace typical ASCII values
     * with their ASCII value representation
     * ( ex: 0x61 ==> ".a" )
     *
     * @type {boolean}
     * @memberof HexEditor
     */
    asciiInline: boolean;
    /**
     * the number of chunks between separators
     *
     * @type {number}
     * @memberof HexEditor
     */
    bytesPerGroup: number;
    /**
     * the number of bits between separators
     * on the bit display
     *
     * @type {number}
     * @memberof HexEditor
     */
    bitsPerGroup: number;
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
    mode: "region" | "select" | "noregion";
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
    editType: "insert" | "overwrite" | "readonly";
    /**
     * the number of regions to traverse
     *
     * @type {number}
     * @memberof HexEditor
     */
    regionDepth: number;
    /**
     * the region data. Data will be displayed in the tooltip
     * if mode is set to "region"
     *
     * @type {IRegion[]}
     * @memberof HexEditor
     */
    regions: IRegion[];
    /**
     * Emitted when the lineNumber changes
     *
     * @type {EventEmitter}
     * @memberof HexEditor
     */
    hexLineChanged: EventEmitter;
    /**
     * Emitted on the change of the cursor's position
     *
     * @type {EventEmitter}
     * @memberof HexEditor
     */
    hexCursorChanged: EventEmitter;
    /**
     * Emitted when the selection changes
     *
     * @type {EventEmitter}
     * @memberof HexEditor
     */
    hexSelectionChanged: EventEmitter;
    /**
     * fired when the file's data changes
     *
     * @type {EventEmitter}
     * @memberof HexEditor
     */
    hexDataChanged: EventEmitter;
    /**
     * fired when the component loads
     */
    hexLoaded: EventEmitter;
    componentWillLoad(): void;
    componentDidLoad(): void;
    /**
    * accepts and reads the given file, storing the result in
    * the file variable
    * @param file
    */
    acceptFile(file: File): Promise<void>;
    /**
     * returns the edited file
     *
     * @returns {(Promise<Uint8Array | void>)}
     * @memberof HexEditor
     */
    saveFile(): Promise<Uint8Array | void>;
    /**
     * sets the line number
     *
     * @param {number} newLineNumber
     * @memberof HexEditor
     */
    setLineNumber(newLineNumber: number): Promise<void>;
    /**
     * sets the new cursor position
     *
     * @param {number} newCursorPosition
     * @memberof HexEditor
     */
    setCursorPosition(newCursorPosition: number, bit?: number): Promise<void>;
    /**
     * sets the new selection bounds.
     * @param {{start?: number, end?: number}} newSelection
     * @memberof HexEditor
     */
    setSelection(newSelection: {
        start?: number;
        end?: number;
        startBit?: number;
        endBit?: number;
    }): Promise<void>;
    /**
     * fetches a Uint8Array of a given length
     * at the given location
     * @param location where to fetch the data from
     * @param length how many bytes to load
     * @memberof HexEditor
     */
    getChunk(location: number, length: number): Promise<{
        out: Uint8Array;
        meta: {
            added: [number, number][];
        };
    }>;
    /**
     * returns the file's metadata
     * @memberof HexEditor
     */
    getFileMetadata(): Promise<File>;
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
    executeSearch(text: string, searchType: typeof HexEditor.prototype.searchType, range?: [number, number], searchByteCount?: 1 | 2 | 4 | 8, searchEndian?: 'big' | 'little'): Promise<number[]>;
    /**
     * builds the elements responsible for the hex view
     */
    buildHexView(): {
        lineViews: any[];
        charViews: any[];
        binViews: any[];
        lineLabels: any[];
        binRegions: any;
        hexRegions: any;
        asciiRegions: any;
    };
    buildChunks(): {
        lineViews: any[];
        charViews: any[];
        binViews: any[];
        lineLabels: any[];
        binRegions: any;
        hexRegions: any;
        asciiRegions: any;
    };
    /**
     * edits the underlying uint8array or
     * adjusts the cursor position
     *
     * @param {KeyboardEvent} evt
     * @returns
     * @memberof HexEditor
     */
    edit(evt: KeyboardEvent): void;
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
    formatSearch(text: string, searchType: typeof HexEditor.prototype.searchType, searchByteCount?: 1 | 2 | 4 | 8, searchEndian?: 'big' | 'little'): number[];
    /**
     * triggers a find operation on the currently selected chunk
     * if there is one, otherwise it searches the full thing
     *
     * @memberof HexEditor
     */
    findInSelection(): Promise<void>;
    /**
     * displays the full hexidecimal view
     */
    showHex(): any;
    /**
     * displays the chunks
     *
     * @memberof HexEditor
     */
    showChunks(): any;
    /**
     * gets the exact position of
     * @param evt the mousedown event
     */
    beginSelection(evt: any): void;
    endSelection(evt: any): void;
    /**
     * This must be an arrow function so it retains the reference to
     * "this" while also not being anonymous. This allows it to be
     * added as an eventlistener directly while retaining the ability
     * to remove it.
     *
     * @memberof MyComponent
     */
    scroll: (evt: WheelEvent) => void;
    render(): any;
    _toggleScrollListener(evt: MouseEvent): void;
}
