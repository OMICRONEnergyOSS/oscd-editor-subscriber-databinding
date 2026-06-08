/** SCL XML namespace URI. */
export declare const SCL_NAMESPACE = "http://www.iec.ch/61850/2003/SCL";
export type SclEdition = '2003' | '2007B' | '2007B4';
/**
 * Derives the SCL schema edition from the root element attributes.
 */
export declare function getSclSchemaVersion(doc: Document): SclEdition;
/**
 * Extracts the `name` attribute from an element.
 * @returns the name, or undefined if there is no name.
 */
export declare function getNameAttribute(element: Element): string | undefined;
/**
 * Extracts the `desc` attribute from an element.
 * @returns the description, or undefined if there is no description.
 */
export declare function getDescriptionAttribute(element: Element): string | undefined;
/** Locale-aware comparison of elements or strings by `name` attribute. */
export declare function compareNames(a: Element | string, b: Element | string): number;
