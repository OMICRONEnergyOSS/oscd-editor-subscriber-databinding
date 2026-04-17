import { LitElement, PropertyValues, TemplateResult } from 'lit';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdListItem } from '@omicronenergy/oscd-ui/list/OscdListItem.js';
import { OscdDivider } from '@omicronenergy/oscd-ui/divider/OscdDivider.js';
import type { Nsdoc } from '../foundation/nsdoc.js';
import { VirtualizedFilteredList } from './virtualized-filtered-list.js';
declare const ExtRefLnBindingList_base: typeof LitElement & import("@open-wc/scoped-elements/lit-element.js").ScopedElementsHostConstructor;
/**
 * A sub element for showing all Ext Refs from a FCDA Element.
 * The List reacts on a custom event to know which FCDA Element was selected and updated the view.
 */
export declare class ExtRefLnBindingList extends ExtRefLnBindingList_base {
    static scopedElements: {
        'oscd-icon': typeof OscdIcon;
        'oscd-list-item': typeof OscdListItem;
        'oscd-divider': typeof OscdDivider;
        'virtualized-filtered-list': typeof VirtualizedFilteredList;
    };
    doc: XMLDocument;
    docVersion?: unknown;
    nsdoc: Nsdoc;
    controlTag: 'SampledValueControl' | 'GSEControl';
    currentSelectedControlElement: Element | undefined;
    currentSelectedFcdaElement: Element | undefined;
    currentIedElement: Element | undefined;
    private boundFcdaSelectHandler;
    private rowSearchValue;
    private matchesRowSearch;
    connectedCallback(): void;
    disconnectedCallback(): void;
    protected updated(_changedProperties: PropertyValues): void;
    private getLNElements;
    private getPartitionedLNElements;
    private getSubscribedExtRefs;
    private onFcdaSelectEvent;
    private subscribeEdits;
    private unsubscribeEdits;
    private bindingNotSupported;
    private buildLNTitle;
    private renderTitle;
    private renderEmptyState;
    private renderSubscribedLN;
    private renderAvailableLN;
    private buildLnBindingGroup;
    private buildSubscribedLnGroup;
    private buildAvailableLnGroup;
    private renderVirtualRow;
    render(): TemplateResult;
    static styles: import("lit").CSSResult;
}
export {};
