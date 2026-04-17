import { LitElement, TemplateResult } from 'lit';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import { OscdList } from '@omicronenergy/oscd-ui/list/OscdList.js';
import { OscdListItem } from '@omicronenergy/oscd-ui/list/OscdListItem.js';
import { OscdDivider } from '@omicronenergy/oscd-ui/divider/OscdDivider.js';
import { OscdOutlinedTextField } from '@omicronenergy/oscd-ui/textfield/OscdOutlinedTextField.js';
declare const VirtualizedFilteredList_base: typeof LitElement & import("@open-wc/scoped-elements/lit-element.js").ScopedElementsHostConstructor;
export declare class VirtualizedFilteredList extends VirtualizedFilteredList_base {
    static scopedElements: {
        'oscd-icon': typeof OscdIcon;
        'oscd-icon-button': typeof OscdIconButton;
        'oscd-list': typeof OscdList;
        'oscd-list-item': typeof OscdListItem;
        'oscd-divider': typeof OscdDivider;
        'oscd-outlined-text-field': typeof OscdOutlinedTextField;
    };
    items: unknown[];
    renderItem: (item: unknown) => TemplateResult;
    keyFunction: (item: unknown) => string;
    matchItem: (item: unknown, regex: RegExp) => boolean;
    placeholder: string;
    private searchValue;
    private searchField?;
    private onInput;
    private clearSearch;
    private get filteredItems();
    render(): TemplateResult;
    static styles: import("lit").CSSResult;
}
export {};
