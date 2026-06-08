export interface Nsdoc {
    nsdoc72?: XMLDocument;
    nsdoc73?: XMLDocument;
    nsdoc74?: XMLDocument;
    nsdoc81?: XMLDocument;
    getDataDescription: (element: Element, ancestors?: Element[]) => {
        label: string;
    };
}
export declare function initializeNsdoc(): Nsdoc;
