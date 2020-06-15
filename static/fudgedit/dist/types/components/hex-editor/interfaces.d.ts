export interface IRegion {
    start: number;
    end: number;
    name?: string;
    description?: string;
    color?: string;
    subRegions?: IRegion[];
}
