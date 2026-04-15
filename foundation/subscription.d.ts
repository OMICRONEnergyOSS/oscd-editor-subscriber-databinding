import { LitElement } from 'lit';
export declare enum View {
    PUBLISHER = 0,
    SUBSCRIBER = 1
}
/**
 * Enumeration stating the Subscribe status of a IED to a GOOSE or Sampled Value.
 */
export declare enum SubscribeStatus {
    Full = 0,
    Partial = 1,
    None = 2
}
export interface ViewDetail {
    view: View;
}
export type ViewEvent = CustomEvent<ViewDetail>;
export declare function newViewEvent(view: View, eventInitDict?: CustomEventInit<ViewDetail>): ViewEvent;
export interface IEDSelectDetail {
    ied: Element | undefined;
}
export type IEDSelectEvent = CustomEvent<IEDSelectDetail>;
export declare function newIEDSelectEvent(ied: Element | undefined, eventInitDict?: CustomEventInit<IEDSelectDetail>): IEDSelectEvent;
export interface FcdaSelectDetail {
    control: Element | undefined;
    fcda: Element | undefined;
}
export type FcdaSelectEvent = CustomEvent<FcdaSelectDetail>;
export declare function newFcdaSelectEvent(control: Element | undefined, fcda: Element | undefined, eventInitDict?: CustomEventInit<FcdaSelectDetail>): FcdaSelectEvent;
export interface SubscriptionChangedDetail {
    control: Element | undefined;
    fcda: Element | undefined;
}
export type SubscriptionChangedEvent = CustomEvent<SubscriptionChangedDetail>;
export declare function newSubscriptionChangedEvent(control: Element | undefined, fcda: Element | undefined, eventInitDict?: CustomEventInit<SubscriptionChangedDetail>): SubscriptionChangedEvent;
export declare function getFcdaTitleValue(fcdaElement: Element): string;
export declare function getFcdaSubtitleValue(fcdaElement: Element): string;
export declare function getExtRef(parentInputs: Element, fcda: Element, control: Element | undefined): Element | undefined;
/**
 * Return Val elements within an LGOS/LSVS instance for a particular IED and control block type.
 * @param ied - IED SCL element.
 * @param cbTagName - Either GSEControl or (defaults to) SampledValueControl.
 * @param firstOnly - If true, return the first element found
 * @returns an Element array of Val SCL elements within an LGOS/LSVS node.
 */
export declare function getSupervisionCbRefs(ied: Element, cbTagName: string): Element[];
export declare function getSupervisionCbRefs(ied: Element, cbTagName: string, firstOnly: boolean): Element | null;
/** Returns the subscriber's supervision LN for a given control block and extRef element
 *
 * @param extRef - The extRef SCL element in the subscribing IED.
 * @returns The supervision LN instance or null if not found
 */
export declare function getExistingSupervision(extRef: Element | null): Element | null;
export declare const serviceTypes: Partial<Record<string, string>>;
export declare function getOrderedIeds(doc: XMLDocument): Element[];
/**
 * An element within this list has 2 properties:
 * - The element itself, either a GSEControl or an IED at this point.
 * - A 'partial' property indicating if the GOOSE is fully initialized or partially.
 */
export interface ListElement {
    element: Element;
    partial?: boolean;
}
export declare class SubscriberListContainer extends LitElement {
    /** List holding all current subscribed Elements. */
    subscribedElements: ListElement[];
    /** List holding all current available Elements which are not subscribed. */
    availableElements: ListElement[];
    /** Current selected IED (when in Subscriber view) */
    currentSelectedIed: Element | undefined;
    /** The current used dataset for subscribing / unsubscribing */
    currentUsedDataset: Element | undefined | null;
    subscriberWrapper: Element;
    protected updated(): void;
    protected resetElements(): void;
}
/** Common `CSS` styles used by DataTypeTemplate subeditors */
export declare const sharedStyles: import("lit").CSSResult;
declare global {
    interface ElementEventMap {
        ['fcda-select']: FcdaSelectEvent;
    }
}
