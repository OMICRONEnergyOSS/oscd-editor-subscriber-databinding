import { LitElement, TemplateResult } from 'lit';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdList } from '@omicronenergy/oscd-ui/list/OscdList.js';
import { OscdOutlinedTextField } from '@omicronenergy/oscd-ui/textfield/OscdOutlinedTextField.js';
declare const FilteredList_base: typeof LitElement & import("@open-wc/scoped-elements/lit-element.js").ScopedElementsHostConstructor;
/**
 * A slot-based filterable list. Renders a search input above an `<oscd-list>`
 * and hides slotted items whose text content does not match the search query.
 *
 * Items can provide searchable text via their `data-value` attribute or via
 * their `textContent`. Items without either are always shown.
 */
export declare class FilteredList extends FilteredList_base {
    static scopedElements: {
        'oscd-icon': typeof OscdIcon;
        'oscd-list': typeof OscdList;
        'oscd-outlined-text-field': typeof OscdOutlinedTextField;
    };
    /** Not used functionally but preserved for API compatibility with legacy callers. */
    activatable: boolean;
    private searchValue;
    private searchField?;
    private onInput;
    private applyFilter;
    protected updated(): void;
    render(): TemplateResult;
    static styles: import("lit").CSSResult;
}
export {};
