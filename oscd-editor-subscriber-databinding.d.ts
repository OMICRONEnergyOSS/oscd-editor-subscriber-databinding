import { LitElement, TemplateResult } from 'lit';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import OscdSclDialogs from '@omicronenergy/oscd-scl-dialogs/OscdSclDialogs.js';
import { OscdOutlinedSegmentedButton } from '@omicronenergy/oscd-ui/labs/segmentedbutton/OscdOutlinedSegmentedButton.js';
import { OscdOutlinedSegmentedButtonSet } from '@omicronenergy/oscd-ui/labs/segmentedbuttonset/OscdOutlinedSegmentedButtonSet.js';
import { Nsdoc } from './foundation/nsdoc.js';
import { FcdaBindingList } from './subscription/fcda-binding-list.js';
import { ExtRefLnBindingList } from './subscription/ext-ref-ln-binding-list.js';
type ControlTag = 'GSEControl' | 'SampledValueControl';
declare const OscdEditorSubscriberDatabinding_base: typeof LitElement & import("@open-wc/scoped-elements/lit-element.js").ScopedElementsHostConstructor;
/** An editor plugin for GOOSE and SMV subscriber data binding. */
export default class OscdEditorSubscriberDatabinding extends OscdEditorSubscriberDatabinding_base {
    static scopedElements: {
        'oscd-icon': typeof OscdIcon;
        'oscd-outlined-segmented-button': typeof OscdOutlinedSegmentedButton;
        'oscd-outlined-segmented-button-set': typeof OscdOutlinedSegmentedButtonSet;
        'fcda-binding-list': typeof FcdaBindingList;
        'extref-ln-binding-list': typeof ExtRefLnBindingList;
        'oscd-scl-dialogs': typeof OscdSclDialogs;
    };
    doc: XMLDocument;
    docVersion?: unknown;
    nsdoc: Nsdoc;
    controlTag: ControlTag;
    private sclDialogs;
    private handleEditDialogEvent;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private onControlTagChange;
    render(): TemplateResult;
    static styles: import("lit").CSSResult;
}
export {};
