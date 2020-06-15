import { HexEditor } from './hex-editor';
declare type editType = "insert" | "overwrite";
declare type anyPiece = Original | Added | InProgress;
declare type existingPiece = Existing;
declare abstract class Existing {
    offset: number;
    length: number;
    modified: number;
    private myType;
    editNum: number;
    self: Existing | Existing[];
    constructor(offset: number, length: number, modified: number, myType: typeof Original | typeof Added);
    abstract makeNew(offset: number, length: number, modified?: number): Existing;
    splitAt(position: number): Existing[];
    isContinuedBy(other: this): other is this;
    join(other: this): Existing;
    get isSelf(): boolean;
    get mOffset(): number;
    get mLength(): number;
    get pieces(): any[];
}
declare class Original extends Existing {
    constructor(offset: number, length: number, modified?: number);
    makeNew(offset: number, length: number, modified?: number): Original;
}
declare class Added extends Existing {
    type: editType;
    editNum: number;
    consumption: {
        startMod: number;
        consumed: boolean;
        piece: existingPiece;
    }[];
    self: Added | Added[];
    constructor(offset: number, length: number, type: editType, editNum: number, consumption?: {
        startMod: number;
        consumed: boolean;
        piece: existingPiece;
    }[], modified?: number);
    makeNew(offset: number, length: number, modified?: number): Added;
}
declare class InProgress {
    offset: number;
    type: editType;
    editNum: number;
    index: number;
    content: number[];
    consumption: {
        startMod: number;
        consumed: boolean;
        piece: existingPiece;
    }[];
    constructor(offset: number, type: editType, editNum: number, index: number);
    get length(): number;
    get modified(): number;
    get mLength(): number;
    get mOffset(): number;
    get pieces(): this[];
}
/**
 * controls the editing of values in the hex editor
 */
export declare class EditController {
    private parent;
    original: Uint8Array;
    added: Uint8Array;
    pieces: Array<anyPiece>;
    undoStack: Array<anyPiece>;
    redoStack: Array<[Existing, number, anyPiece]>;
    inProgress: InProgress;
    chunk: string;
    constructor(parent: HexEditor);
    initEdit(offset: number, type: editType): void;
    /**
     * gets the piece at an offset
     * @param offset
     */
    getPieceAtOffset(offset: number): {
        targetSlicePoint: number;
        targetIndex: number;
        target: existingPiece;
    };
    get isInProgress(): boolean;
    /**
     * targets the piece next to the inProgress piece, if it exists, and
     * modifies its length/offset by amount if the inProgress type is
     * set to 'overwrite'.
     *
     * @param amount - the amount to modify the target piece's length by
     */
    modifyNextPiece(amount: number, index: number, piece?: Added): void;
    find(searchArr: number[], from: number, maxLength?: number): any[];
    redo(): void;
    undo(): void;
    backSpace(): void;
    /**
     * builds the edit
     *
     * @param {KeyboardEvent} keyStroke
     * @memberof EditController
     */
    buildEdit(keyStroke: KeyboardEvent): void;
    commit(): void;
    rollback(): void;
    render(start: number, length: number): {
        out: Uint8Array;
        meta: {
            added: [number, number][];
        };
    };
    get length(): number;
    save(): Uint8Array;
    private getPieceBuffer;
}
export {};
