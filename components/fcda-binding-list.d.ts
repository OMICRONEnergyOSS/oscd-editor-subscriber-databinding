import { LitElement, TemplateResult } from 'lit';
import type { PropertyValues } from 'lit';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import { OscdListItem } from '@omicronenergy/oscd-ui/list/OscdListItem.js';
import { OscdFilterButton } from '@omicronenergy/oscd-ui/filter-button/OscdFilterButton.js';
import { OscdMenu } from '@omicronenergy/oscd-ui/menu/OscdMenu.js';
import { OscdMenuItem } from '@omicronenergy/oscd-ui/menu/OscdMenuItem.js';
import { OscdDivider } from '@omicronenergy/oscd-ui/divider/OscdDivider.js';
import { VirtualizedFilteredList } from './virtualized-filtered-list.js';
type controlTag = 'SampledValueControl' | 'GSEControl';
declare const FcdaBindingList_base: typeof LitElement & import("@open-wc/scoped-elements/lit-element.js").ScopedElementsHostConstructor;
/**
 * A sub element for showing all Goose/Sampled Value Controls.
 * A control can be edited using the oscd-scl-dialogs.
 * And when selecting a FCDA Element a custom event is fired, so other list can be updated.
 */
export declare class FcdaBindingList extends FcdaBindingList_base {
    static scopedElements: {
        'oscd-icon': typeof OscdIcon;
        'oscd-icon-button': typeof OscdIconButton;
        'oscd-list-item': typeof OscdListItem;
        'oscd-filter-button': typeof OscdFilterButton;
        'oscd-menu': typeof OscdMenu;
        'oscd-menu-item': typeof OscdMenuItem;
        'oscd-divider': typeof OscdDivider;
        'virtualized-filtered-list': typeof VirtualizedFilteredList;
    };
    doc: XMLDocument;
    docVersion?: unknown;
    controlTag: controlTag;
    private selectedControlElement;
    private selectedFcdaElement;
    private extRefCounters;
    /** The control element that the context menu currently targets. */
    private menuControlElement;
    get hideSubscribed(): boolean;
    set hideSubscribed(value: boolean);
    get hideNotSubscribed(): boolean;
    set hideNotSubscribed(value: boolean);
    private controlBlockMenu;
    private subscriptionCountIndex;
    private get filterItems();
    constructor();
    private getControlElements;
    private getFcdaElements;
    private createSubscriptionCountKey;
    private getControlSourceValues;
    private getSubscriptionCountKeyForFcda;
    private getSubscriptionCountKeyForExtRef;
    private buildSubscriptionCountIndex;
    private getExtRefCount;
    private openControlMenu;
    private onMenuEdit;
    private onMenuEditDataSet;
    private onMenuEditSmvOpts;
    private onMenuEditCommunication;
    private onMenuRemove;
    private resetSelection;
    private onFcdaSelect;
    protected willUpdate(_changedProperties: PropertyValues): void;
    protected updated(_changedProperties: PropertyValues): void;
    renderFCDA(controlElement: Element, fcdaElement: Element): TemplateResult;
    private onFilterDialogClose;
    renderTitle(): TemplateResult;
    private renderControlBlockMenu;
    private renderControlRow;
    private renderVirtualRow;
    private matchesRowSearch;
    private buildVirtualRows;
    renderControls(controlElements: Element[]): TemplateResult;
    render(): TemplateResult;
    static styles: import("lit").CSSResult;
}
export {};
