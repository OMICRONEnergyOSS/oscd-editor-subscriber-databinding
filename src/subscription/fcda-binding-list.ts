// src/subscription/fcda-binding-list.ts
//
// Copied from legacy monorepo and transformed for standalone use.
// Original: legacy/compas-open-scd/packages/plugins/src/editors/subscription/fcda-binding-list.ts
// Changes:
//   - lit-element → lit + lit/decorators.js
//   - lit-html → lit (nothing) + lit/directives/class-map.js
//   - @openscd/open-scd/src/foundation.js → local foundation + @openscd/scl-lib
//   - @openscd/open-scd/src/icons/icons.js → unified OscdIcon (text content auto-detects SCL icons)
//   - ../../wizards/wizard-library.js → @omicronenergy/oscd-scl-dialogs (Step 4)
//   - Removed @customElement('fcda-binding-list') decorator
//   - editCount → docVersion
//   - lit-translate → @lit/localize msg()
//   - Step 5: Replaced all mwc-* with oscd-ui components
//     mwc-icon → OscdIcon, mwc-icon-button → OscdIconButton, mwc-list-item → OscdListItem
//     mwc-menu + mwc-check-list-item → OscdFilterButton (DP-1)
//     Removed mwc-list (FilteredList wraps OscdList), removed SVGTemplateResult
//     Slot renames: graphic→start, secondary→supporting-text, meta→end
//     Removed: graphic, hasMeta, twoline, noninteractive, value attrs
//     Added: type="button" for interactive items, data-value for search
//     iconControlLookup changed from SVGTemplateResult to string (unified OscdIcon)
//   - Step 6: Replaced edit icon button with context menu (more_vert trigger).
//     Added OscdMenu/OscdMenuItem, control-block-helpers for associated element
//     lookups, and buildRemoveEdits for Remove action.
//     SMV variant includes Edit SmvOpts menu item.

import { css, html, LitElement, nothing, TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import type { PropertyValues } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { msg } from '@lit/localize';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';

import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import { OscdListItem } from '@omicronenergy/oscd-ui/list/OscdListItem.js';
import { OscdFilterButton } from '@omicronenergy/oscd-ui/filter-button/OscdFilterButton.js';
import { OscdMenu } from '@omicronenergy/oscd-ui/menu/OscdMenu.js';
import { OscdMenuItem } from '@omicronenergy/oscd-ui/menu/OscdMenuItem.js';
import { OscdDivider } from '@omicronenergy/oscd-ui/divider/OscdDivider.js';
import type { SelectItem } from '@omicronenergy/oscd-ui/selection-list/OscdSelectionList.js';
import type { FilterButtonDialogCloseEvent } from '@omicronenergy/oscd-ui/filter-button/OscdFilterButton.js';

import { identity } from '@openscd/scl-lib';
import { newEditEventV2 } from '@openscd/oscd-api/utils.js';
import {
  getDescriptionAttribute,
  getNameAttribute,
} from '../foundation/scl.js';
import { newEditDialogEditEvent } from '@omicronenergy/oscd-scl-dialogs/oscd-scl-dialogs-events.js';
import { FilteredList } from '../foundation/filtered-list.js';

import {
  getFcdaSubtitleValue,
  getFcdaTitleValue,
  newFcdaSelectEvent,
  styles,
  SubscriptionChangedEvent,
} from '../foundation/subscription.js';
import { getSubscribedExtRefElements } from '../foundation/subscription-later-binding.js';
import {
  getAssociatedDataSet,
  getAssociatedSMV,
  getAssociatedSmvOpts,
  buildRemoveEdits,
} from '../foundation/shared/control-block-helpers.js';

type controlTag = 'SampledValueControl' | 'GSEControl';

/** Maps control tag to the SCL icon name recognized by unified OscdIcon. */
const iconControlLookup: Record<controlTag, string> = {
  GSEControl: 'gooseIcon',
  SampledValueControl: 'smvIcon',
};

const controlBlockListTitle: Record<controlTag, string> = {
  GSEControl: 'GOOSE Messages',
  SampledValueControl: 'Sampled Value Messages',
};

/**
 * A sub element for showing all Goose/Sampled Value Controls.
 * A control can be edited using the standard wizard.
 * And when selecting a FCDA Element a custom event is fired, so other list can be updated.
 */
export class FcdaBindingList extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'filtered-list': FilteredList,
    'oscd-icon': OscdIcon,
    'oscd-icon-button': OscdIconButton,
    'oscd-list-item': OscdListItem,
    'oscd-filter-button': OscdFilterButton,
    'oscd-menu': OscdMenu,
    'oscd-menu-item': OscdMenuItem,
    'oscd-divider': OscdDivider,
  };

  @property({ attribute: false })
  doc!: XMLDocument;
  @property({ attribute: false })
  docVersion?: unknown;
  @property()
  controlTag!: controlTag;
  @property()
  includeLaterBinding!: boolean;

  // The selected Elements when a FCDA Line is clicked.
  @state()
  private selectedControlElement: Element | undefined;
  @state()
  private selectedFcdaElement: Element | undefined;
  @state()
  private extRefCounters = new Map();

  /** The control element that the context menu currently targets. */
  @state()
  private menuControlElement: Element | undefined;

  @property({
    type: Boolean,
    hasChanged() {
      return false;
    },
  })
  get hideSubscribed(): boolean {
    return (
      localStorage.getItem(
        `fcda-binding-list-${
          this.includeLaterBinding ? 'later-binding' : 'data-binding'
        }-${this.controlTag}$hideSubscribed`,
      ) === 'true'
    );
  }

  set hideSubscribed(value: boolean) {
    const oldValue = this.hideSubscribed;
    localStorage.setItem(
      `fcda-binding-list-${
        this.includeLaterBinding ? 'later-binding' : 'data-binding'
      }-${this.controlTag}$hideSubscribed`,
      `${value}`,
    );
    this.requestUpdate('hideSubscribed', oldValue);
  }

  @property({
    type: Boolean,
    hasChanged() {
      return false;
    },
  })
  get hideNotSubscribed(): boolean {
    return (
      localStorage.getItem(
        `fcda-binding-list-${
          this.includeLaterBinding ? 'later-binding' : 'data-binding'
        }-${this.controlTag}$hideNotSubscribed`,
      ) === 'true'
    );
  }

  set hideNotSubscribed(value: boolean) {
    const oldValue = this.hideNotSubscribed;
    localStorage.setItem(
      `fcda-binding-list-${
        this.includeLaterBinding ? 'later-binding' : 'data-binding'
      }-${this.controlTag}$hideNotSubscribed`,
      `${value}`,
    );
    this.requestUpdate('hideNotSubscribed', oldValue);
  }

  @query('.control-block-list') controlBlockList!: FilteredList;
  @query('.control-block-menu') private controlBlockMenu!: OscdMenu;

  private get filterItems(): SelectItem[] {
    return [
      {
        headline: msg('Subscribed'),
        selected: !this.hideSubscribed,
      },
      {
        headline: msg('Not Subscribed'),
        selected: !this.hideNotSubscribed,
      },
    ];
  }

  private boundResetExtRefCount = this.resetExtRefCount.bind(this);

  constructor() {
    super();

    this.resetSelection = this.resetSelection.bind(this);
    parent.addEventListener('open-doc', this.resetSelection);
  }

  override connectedCallback(): void {
    super.connectedCallback();

    // In legacy, this ran in the constructor where global registration meant
    // the element was already in the DOM. With ScopedElementsMixin the
    // constructor runs before the element is connected, so
    // this.closest('.container') would return null. We move it here.
    const parentDiv = this.closest('.container');
    if (parentDiv) {
      parentDiv.addEventListener(
        'subscription-changed',
        this.boundResetExtRefCount,
      );
    }
  }

  override disconnectedCallback(): void {
    const parentDiv = this.closest('.container');
    if (parentDiv) {
      parentDiv.removeEventListener(
        'subscription-changed',
        this.boundResetExtRefCount,
      );
    }
    super.disconnectedCallback();
  }

  private getControlElements(): Element[] {
    if (this.doc) {
      return Array.from(this.doc.querySelectorAll(`LN0 > ${this.controlTag}`));
    }
    return [];
  }

  private getFcdaElements(controlElement: Element): Element[] {
    const lnElement = controlElement.parentElement;
    if (lnElement) {
      return Array.from(
        lnElement.querySelectorAll(
          `:scope > DataSet[name=${controlElement.getAttribute(
            'datSet',
          )}] > FCDA`,
        ),
      );
    }
    return [];
  }

  private resetExtRefCount(event: SubscriptionChangedEvent): void {
    if (event.detail.control && event.detail.fcda) {
      const controlBlockFcdaId = `${identity(event.detail.control)} ${identity(
        event.detail.fcda,
      )}`;
      this.extRefCounters.delete(controlBlockFcdaId);
    }
  }

  private getExtRefCount(
    fcdaElement: Element,
    controlElement: Element,
  ): number {
    const controlBlockFcdaId = `${identity(controlElement)} ${identity(
      fcdaElement,
    )}`;
    if (!this.extRefCounters.has(controlBlockFcdaId)) {
      const extRefCount = getSubscribedExtRefElements(
        <Element>this.doc.getRootNode(),
        this.controlTag,
        fcdaElement,
        controlElement!,
        this.includeLaterBinding,
      ).length;
      this.extRefCounters.set(controlBlockFcdaId, extRefCount);
    }
    return this.extRefCounters.get(controlBlockFcdaId);
  }

  private openControlMenu(event: Event, controlElement: Element): void {
    event.stopPropagation();
    this.menuControlElement = controlElement;
    const button = event.currentTarget as HTMLElement;
    this.controlBlockMenu.anchorElement = button;
    this.controlBlockMenu.show();
  }

  private onMenuEdit(): void {
    if (!this.menuControlElement) return;
    this.dispatchEvent(newEditDialogEditEvent(this.menuControlElement));
  }

  private onMenuEditDataSet(): void {
    if (!this.menuControlElement) return;
    const dataSet = getAssociatedDataSet(this.menuControlElement);
    if (dataSet) {
      this.dispatchEvent(newEditDialogEditEvent(dataSet));
    }
  }

  private onMenuEditSmvOpts(): void {
    if (!this.menuControlElement) return;
    const smvOpts = getAssociatedSmvOpts(this.menuControlElement);
    if (smvOpts) {
      this.dispatchEvent(newEditDialogEditEvent(smvOpts));
    }
  }

  private onMenuEditCommunication(): void {
    if (!this.menuControlElement) return;
    const smv = getAssociatedSMV(this.menuControlElement);
    if (smv) {
      this.dispatchEvent(newEditDialogEditEvent(smv));
    }
  }

  private onMenuRemove(): void {
    if (!this.menuControlElement) return;
    const edits = buildRemoveEdits(this.menuControlElement);
    if (edits.length > 0) {
      this.dispatchEvent(
        newEditEventV2(edits, {
          title: msg('Remove SampledValueControl'),
        }),
      );
    }
  }

  private resetSelection(): void {
    this.selectedControlElement = undefined;
    this.selectedFcdaElement = undefined;
  }

  private onFcdaSelect(controlElement: Element, fcdaElement: Element) {
    this.resetSelection();

    this.selectedControlElement = controlElement;
    this.selectedFcdaElement = fcdaElement;
  }

  protected updated(_changedProperties: PropertyValues): void {
    super.updated(_changedProperties);

    // When a new document is loaded or the selection is changed
    // we will fire the FCDA Select Event.
    if (
      _changedProperties.has('doc') ||
      _changedProperties.has('selectedControlElement') ||
      _changedProperties.has('selectedFcdaElement')
    ) {
      this.dispatchEvent(
        newFcdaSelectEvent(
          this.selectedControlElement,
          this.selectedFcdaElement,
        ),
      );
    }

    // When a new document is loaded we will reset the Map to clear old entries.
    if (_changedProperties.has('doc')) {
      this.extRefCounters = new Map();
    }
  }

  renderFCDA(controlElement: Element, fcdaElement: Element): TemplateResult {
    const fcdaCount = this.getExtRefCount(fcdaElement, controlElement);

    const filterClasses = {
      subitem: true,
      'show-subscribed': fcdaCount !== 0,
      'show-not-subscribed': fcdaCount === 0,
    };

    return html`<oscd-list-item
      type="button"
      class="${classMap(filterClasses)}"
      @click=${() => this.onFcdaSelect(controlElement, fcdaElement)}
      data-value="${identity(controlElement)}
             ${identity(fcdaElement)}"
    >
      <div slot="headline">${getFcdaTitleValue(fcdaElement)}</div>
      <div slot="supporting-text">${getFcdaSubtitleValue(fcdaElement)}</div>
      <oscd-icon slot="start">subdirectory_arrow_right</oscd-icon>
      ${fcdaCount !== 0 ? html`<span slot="end">${fcdaCount}</span>` : nothing}
    </oscd-list-item>`;
  }

  updateBaseFilterState(): void {
    if (this.hideSubscribed) {
      this.controlBlockList!.classList.add('show-subscribed');
    } else {
      this.controlBlockList!.classList.remove('show-subscribed');
    }
    if (!this.hideNotSubscribed) {
      this.controlBlockList!.classList.add('show-not-subscribed');
    } else {
      this.controlBlockList!.classList.remove('show-not-subscribed');
    }
  }

  private onFilterDialogClose(event: FilterButtonDialogCloseEvent): void {
    // OscdFilterButton extends OscdSelectionList which mutates its .items
    // in-place on click. Read the selected state back from the component.
    const filterButton = event.target as HTMLElement & { items: SelectItem[] };
    this.hideSubscribed = !filterButton.items[0]?.selected;
    this.hideNotSubscribed = !filterButton.items[1]?.selected;
    this.updateBaseFilterState();
  }

  protected firstUpdated(): void {
    this.updateBaseFilterState();
  }

  renderTitle(): TemplateResult {
    const menuClasses = {
      'filter-off': this.hideSubscribed || this.hideNotSubscribed,
    };
    return html`<h1>
      ${controlBlockListTitle[this.controlTag]}
      <oscd-filter-button
        class="actions-menu-icon ${classMap(menuClasses)}"
        .items=${this.filterItems}
        header="${msg('Filter')}"
        multiselect
        @filter-button-dialog-close=${(e: FilterButtonDialogCloseEvent) =>
          this.onFilterDialogClose(e)}
      ></oscd-filter-button>
    </h1> `;
  }

  private renderControlBlockMenu(): TemplateResult {
    const control = this.menuControlElement;
    const hasDataSet = control ? !!getAssociatedDataSet(control) : false;
    const hasCommunication = control ? !!getAssociatedSMV(control) : false;
    const hasSmvOpts = control ? !!getAssociatedSmvOpts(control) : false;

    return html`<oscd-menu class="control-block-menu" positioning="popover">
      <oscd-menu-item @click=${() => this.onMenuEdit()}>
        <div slot="headline">${msg('Edit')}</div>
      </oscd-menu-item>
      ${hasDataSet
        ? html`<oscd-menu-item @click=${() => this.onMenuEditDataSet()}>
            <div slot="headline">${msg('Edit DataSet')}</div>
          </oscd-menu-item>`
        : nothing}
      ${hasSmvOpts
        ? html`<oscd-menu-item @click=${() => this.onMenuEditSmvOpts()}>
            <div slot="headline">${msg('Edit SmvOpts')}</div>
          </oscd-menu-item>`
        : nothing}
      ${hasCommunication
        ? html`<oscd-menu-item @click=${() => this.onMenuEditCommunication()}>
            <div slot="headline">${msg('Edit Communication')}</div>
          </oscd-menu-item>`
        : nothing}
      <oscd-menu-item @click=${() => this.onMenuRemove()}>
        <div slot="headline">${msg('Remove')}</div>
      </oscd-menu-item>
    </oscd-menu>`;
  }

  renderControls(controlElements: Element[]): TemplateResult {
    return html`<filtered-list class="control-block-list" activatable>
      ${controlElements
        .filter(controlElement => this.getFcdaElements(controlElement).length)
        .map(controlElement => {
          const fcdaElements = this.getFcdaElements(controlElement);
          const showSubscribed = fcdaElements.some(
            fcda => this.getExtRefCount(fcda, controlElement) !== 0,
          );
          const showNotSubscribed = fcdaElements.some(
            fcda => this.getExtRefCount(fcda, controlElement) === 0,
          );

          const filterClasses = {
            control: true,
            'show-subscribed': showSubscribed,
            'show-not-subscribed': showNotSubscribed,
          };

          return html`
            <oscd-list-item
              class="${classMap(filterClasses)}"
              data-value="${identity(controlElement)}${fcdaElements
                .map(
                  fcdaElement => `
                        ${getFcdaTitleValue(fcdaElement)}
                        ${getFcdaSubtitleValue(fcdaElement)}
                        ${identity(fcdaElement)}`,
                )
                .join('')}"
            >
              <oscd-icon-button
                slot="end"
                class="interactive"
                @click=${(e: Event) => this.openControlMenu(e, controlElement)}
                ><oscd-icon>more_vert</oscd-icon></oscd-icon-button
              >
              <div slot="headline">
                ${getNameAttribute(controlElement)}
                ${getDescriptionAttribute(controlElement)
                  ? html`${getDescriptionAttribute(controlElement)}`
                  : nothing}
              </div>
              <div slot="supporting-text">${identity(controlElement)}</div>
              <oscd-icon slot="start"
                >${iconControlLookup[this.controlTag]}</oscd-icon
              >
            </oscd-list-item>
            <oscd-divider></oscd-divider>
            ${fcdaElements.map(fcdaElement =>
              this.renderFCDA(controlElement, fcdaElement),
            )}
          `;
        })}
    </filtered-list>`;
  }

  render(): TemplateResult {
    const controlElements = this.getControlElements();
    return html`<section tabindex="0">
      ${this.renderTitle()}
      ${controlElements
        ? this.renderControls(controlElements)
        : html`<h4>${msg('Not Subscribed')}</h4> `}
      ${this.renderControlBlockMenu()}
    </section>`;
  }

  static styles = css`
    ${styles}

    oscd-list-item.hidden:not([type='button']) + oscd-divider {
      display: none;
    }

    section {
      position: relative;
    }

    .actions-menu-icon {
      float: right;
    }

    .actions-menu-icon.filter-off {
      color: var(--secondary);
      background-color: var(--mdc-theme-background);
    }

    /* Filtering rules for control blocks end up implementing logic to allow
    very fast CSS response. The following rules appear to be minimal but can be
    hard to understand intuitively for the multiple conditions. If modifying,
    it is suggested to create a truth-table to check for side-effects */

    /* remove all control blocks if no filters */
    filtered-list.control-block-list:not(.show-subscribed, .show-not-subscribed)
      oscd-list-item {
      display: none;
    }

    /* remove control blocks taking care to respect multiple conditions */
    filtered-list.control-block-list.show-not-subscribed:not(.show-subscribed)
      oscd-list-item.control.show-subscribed:not(.show-not-subscribed) {
      display: none;
    }

    filtered-list.control-block-list.show-subscribed:not(.show-not-subscribed)
      oscd-list-item.control.show-not-subscribed:not(.show-subscribed) {
      display: none;
    }

    /* remove fcdas if not part of filter */
    filtered-list.control-block-list:not(.show-not-subscribed)
      oscd-list-item.subitem.show-not-subscribed {
      display: none;
    }

    filtered-list.control-block-list:not(.show-subscribed)
      oscd-list-item.subitem.show-subscribed {
      display: none;
    }

    .interactive {
      pointer-events: all;
    }

    .subitem {
      padding-left: 16px;
    }
  `;
}
