/**
 * @param fcda - Data attribute reference in a data set
 * @returns Data objects `CDC` and data attributes `bType`
 */
export declare function fcdaSpecification(fcda: Element): {
    cdc: string | null;
    bType: string | null;
};
/**
 * Edition 2 and later SCL files allow to restrict subscription on
 * later binding type inputs (`ExtRef` elements) based on a `CDC` and
 * basic type `bType`.
 * @param extRef - A later binding type input in the sink IED
 * @returns data objects `CDC` and data attribute basic type `bType` or `null`
 */
export declare function inputRestriction(extRef: Element): {
    cdc: string | null;
    bType: string | null;
};
/**
 * Simple function to check if the attribute of the Left Side has the same value as the attribute of the Right Element.
 *
 * @param leftElement   - The Left Element to check against.
 * @param rightElement  - The Right Element to check.
 * @param attributeName - The name of the attribute to check.
 */
export declare function sameAttributeValue(leftElement: Element | undefined, rightElement: Element | undefined, attributeName: string): boolean;
/**
 * Simple function to check if the attribute of the Left Side has the same value as the attribute of the Right Element.
 *
 * @param leftElement        - The Left Element to check against.
 * @param leftAttributeName  - The name of the attribute (left) to check against.
 * @param rightElement       - The Right Element to check.
 * @param rightAttributeName - The name of the attribute (right) to check.
 */
export declare function sameAttributeValueDiffName(leftElement: Element | undefined, leftAttributeName: string, rightElement: Element | undefined, rightAttributeName: string): boolean;
/**
 * Check if specific attributes from the ExtRef Element are the same as the ones from the FCDA Element
 * and also if the IED Name is the same. If that is the case this ExtRef subscribes to the selected FCDA
 * Element.
 *
 * @param controlTag     - Indicates which type of control element.
 * @param controlElement - The Control Element to check against.
 * @param fcdaElement    - The FCDA Element to check against.
 * @param extRefElement  - The Ext Ref Element to check.
 */
export declare function isSubscribedTo(controlTag: 'SampledValueControl' | 'GSEControl', controlElement: Element | undefined, fcdaElement: Element | undefined, extRefElement: Element): boolean;
/**
 * Check if the ExtRef is already subscribed to a FCDA Element.
 *
 * @param extRefElement - The Ext Ref Element to check.
 */
export declare function isSubscribed(extRefElement: Element): boolean;
export declare function getExtRefElements(rootElement: Element, fcdaElement: Element | undefined, includeLaterBinding: boolean): Element[];
export declare function getSubscribedExtRefElements(rootElement: Element, controlTag: 'SampledValueControl' | 'GSEControl', fcdaElement: Element | undefined, controlElement: Element | undefined, includeLaterBinding: boolean): Element[];
