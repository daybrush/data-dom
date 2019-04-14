
export interface DataStructure {
    key?: string | number;
    element?: HTMLElement;
    ref?: (e: this, index: number) => void;
    children?: undefined | this | Array<this | undefined>;
}
