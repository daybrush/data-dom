import {IObject, isUndefined} from "@daybrush/utils";
import { DataStructure } from "./types";

function concat<T>(arr: T | T[]): T[] {
    return [].concat(arr);
}

function render<T extends DataStructure>(
    createElement: (structure: T) => HTMLElement,
    structure: T,
    parentStructureIndex: number = 0,
    parentEl?: Element,
): T {
    const { children } = structure;
    const el = createElement(structure);

    structure.element = el;
    if (structure.ref) {
        structure.ref(structure, parentStructureIndex);
    }
    if (children) {
        concat(children).filter(child => child).forEach((child, i) => {
            render(
                createElement,
                child,
                i,
                el,
            );
        });
    }
    parentEl && parentEl.appendChild(el);
    return structure;
}

function compare<T extends DataStructure>(
    prevArr: T[],
    nextArr: T[],
    syncCallback: (prev: T, next: T, index: number) => void,
) {
    const prevKeys: Array<number | string> = prevArr.map(({ key }, i) => isUndefined(key) ? i : key);
    const nextKeys: Array<number | string> = nextArr.map(({ key }, i) => isUndefined(key) ? i : key);
    const prevKeysObject: IObject<number> = {};
    const nextKeysObject = {};
    const added = [];
    const removed = [];
    const changed = [];

    prevKeys.forEach((key, i) => {
        prevKeysObject[key] = i;
    });
    nextKeys.forEach((key, i) => {
        if (!(key in prevKeysObject)) {
            added.push(i);
        } else {
            syncCallback(prevArr[prevKeysObject[key]], nextArr[i], i);
        }
        nextKeysObject[key] = i;
    });
    prevKeys.forEach((key, i) => {
        const index = nextKeysObject[key];
        if (isUndefined(index)) {
            removed.push(i);
        } else if (i !== index) {
            changed.push([i, index]);
        }
    });
    changed.sort((a, b) => {
        return a[1] > b[1] ? 1 : -1;
      });

    const newChanged: number[][] = changed.filter(changeInfo => changeInfo[1] < changeInfo[0]);

    return {added, removed, changed: newChanged};
}

export function update<T extends DataStructure>(
    createElement: (structure: T) => HTMLElement,
    updateElement: (prevStructure: T, nextStructure: T) => void,
    prevStructure: T | T[],
    nextStructure: T | T[],
    parentStructure?: T,
) {
    const prevStructures = concat(prevStructure || []);
    const nextStructures = concat(nextStructure || []);
    const {added, changed, removed} = compare<T>(
        prevStructures as T[],
        nextStructures || [],
        (prev, next, index) => {
            next.element = prev.element;
            if (next.ref) {
                next.ref(next, index);
            }
            updateElement(prev, next);
            update(
                createElement,
                updateElement,
                prev.children,
                next.children,
                next,
            );
        },
    );
    if (parentStructure) {
        const parentElement = parentStructure.element;

        removed.reverse().forEach(index => {
            parentElement.removeChild(prevStructures[index].element);
        });
        if (changed.length) {
            let min = Infinity;
            let max = -1;

            changed.forEach(([from, to]) => {
                min = Math.min(min, to);
                max = Math.max(max, to);
            });
            added.forEach(index => {
                render(
                    createElement,
                    nextStructures[index],
                    index,
                );
                min = Math.min(min, index);
                max = Math.max(max, index);
            });

            for (let i = max; i >= min; --i) {
                parentElement.insertBefore(
                    nextStructure[i].element,
                    nextStructure[i + 1] && nextStructure[i + 1].element,
                );
            }
        } else {
            added.forEach(index => {
                const { element } = render(
                    createElement,
                    nextStructures[index],
                    index,
                );
                parentElement.insertBefore(
                    element,
                    nextStructures[index + 1] && nextStructures[index + 1].element,
                );
            });
        }

        if (nextStructure) {
            parentStructure.children = (nextStructure as T);
        }
    }
}

export default class DataDOM<T extends DataStructure> {
    constructor(
        private createElement: (structure: T) => HTMLElement,
        private updateElement: (prevStructure: T, nextStructure: T) => void,
    ) {
    }
    public render(structure: T, parentEl: HTMLElement): T {
        return render(this.createElement, structure, 0, parentEl);
    }
    public update(prevStructure: T | T[], nextStructure: T | T[], parentStructure?: T) {
        update(
            this.createElement,
            this.updateElement,
            prevStructure,
            nextStructure,
            parentStructure,
        );
        return this;
    }
}
