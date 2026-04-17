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
  getSclSchemaVersion,
} from '../foundation/scl.js';
import { newEditDialogEditEvent } from '@omicronenergy/oscd-scl-dialogs/oscd-scl-dialogs-events.js';

import {
  getFcdaSubtitleValue,
  getFcdaTitleValue,
  newFcdaSelectEvent,
  serviceTypes,
  sharedStyles,
} from './subscription.js';
import { VirtualizedFilteredList } from './virtualized-filtered-list.js';
import {
  getAssociatedDataSet,
  getAssociatedCommunication,
  getAssociatedSmvOpts,
  buildRemoveEdits,
} from '../foundation/control-block-helpers.js';

type controlTag = 'SampledValueControl' | 'GSEControl';

interface SubscriptionCountEntry {
  total: number;
  bySinkIedName: Map<string, number>;
}

interface ControlRow {
  type: 'control';
  key: string;
  controlElement: Element;
  searchText: string;
}

interface FcdaRow {
  type: 'fcda';
  key: string;
  controlElement: Element;
  fcdaElement: Element;
  searchText: string;
}

type VirtualRow = ControlRow | FcdaRow;

const controlBlockListTitle: Record<controlTag, string> = {
  GSEControl: 'GOOSE Messages',
  SampledValueControl: 'Sampled Value Messages',
};

const removeActionTitle: Record<controlTag, string> = {
  GSEControl: 'Remove GSEControl',
  SampledValueControl: 'Remove SampledValueControl',
};

/**
 * A sub element for showing all Goose/Sampled Value Controls.
 * A control can be edited using the oscd-scl-dialogs.
 * And when selecting a FCDA Element a custom event is fired, so other list can be updated.
 */
export class FcdaBindingList extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'oscd-icon': OscdIcon,
    'oscd-icon-button': OscdIconButton,
    'oscd-list-item': OscdListItem,
    'oscd-filter-button': OscdFilterButton,
    'oscd-menu': OscdMenu,
    'oscd-menu-item': OscdMenuItem,
    'oscd-divider': OscdDivider,
    'virtualized-filtered-list': VirtualizedFilteredList,
  };

  @property({ attribute: false })
  doc!: XMLDocument;

  @property({ attribute: false })
  docVersion?: unknown;

  @property()
  controlTag!: controlTag;

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
        `fcda-binding-list-data-binding-${this.controlTag}$hideSubscribed`,
      ) === 'true'
    );
  }

  set hideSubscribed(value: boolean) {
    localStorage.setItem(
      `fcda-binding-list-data-binding-${this.controlTag}$hideSubscribed`,
      `${value}`,
    );
    this.requestUpdate();
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
        `fcda-binding-list-data-binding-${this.controlTag}$hideNotSubscribed`,
      ) === 'true'
    );
  }

  set hideNotSubscribed(value: boolean) {
    localStorage.setItem(
      `fcda-binding-list-data-binding-${this.controlTag}$hideNotSubscribed`,
      `${value}`,
    );
    this.requestUpdate();
  }

  @query('.control-block-menu') private controlBlockMenu!: OscdMenu;
  private subscriptionCountIndex = new Map<string, SubscriptionCountEntry>();

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

  constructor() {
    super();

    this.resetSelection = this.resetSelection.bind(this);
    parent.addEventListener('open-doc', this.resetSelection);
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

  private createSubscriptionCountKey(values: string[]): string {
    return values.join('\u001F');
  }

  private getControlSourceValues(controlElement: Element): string[] {
    const lDeviceElement = controlElement.closest('LDevice');
    const lnElement = controlElement.closest('LN0, LN');

    return [
      serviceTypes[this.controlTag] ?? '',
      lDeviceElement?.getAttribute('inst') ?? '',
      lnElement?.getAttribute('prefix') ?? '',
      lnElement?.getAttribute('lnClass') ?? 'LLN0',
      lnElement?.getAttribute('inst') ?? '',
      controlElement.getAttribute('name') ?? '',
    ];
  }

  private getSubscriptionCountKeyForFcda(
    fcdaElement: Element,
    controlElement: Element,
  ): string {
    const keyParts = [
      fcdaElement.closest('IED')?.getAttribute('name') ?? '',
      fcdaElement.getAttribute('ldInst') ?? '',
      fcdaElement.getAttribute('prefix') ?? '',
      fcdaElement.getAttribute('lnClass') ?? '',
      fcdaElement.getAttribute('lnInst') ?? '',
      fcdaElement.getAttribute('doName') ?? '',
      fcdaElement.getAttribute('daName') ?? '',
    ];

    if (getSclSchemaVersion(this.doc) !== '2003') {
      keyParts.push(...this.getControlSourceValues(controlElement));
    }

    return this.createSubscriptionCountKey(keyParts);
  }

  private getSubscriptionCountKeyForExtRef(extRefElement: Element): string {
    const keyParts = [
      extRefElement.getAttribute('iedName') ?? '',
      extRefElement.getAttribute('ldInst') ?? '',
      extRefElement.getAttribute('prefix') ?? '',
      extRefElement.getAttribute('lnClass') ?? '',
      extRefElement.getAttribute('lnInst') ?? '',
      extRefElement.getAttribute('doName') ?? '',
      extRefElement.getAttribute('daName') ?? '',
    ];

    if (getSclSchemaVersion(this.doc) !== '2003') {
      keyParts.push(
        extRefElement.getAttribute('serviceType') ?? '',
        extRefElement.getAttribute('srcLDInst') ?? '',
        extRefElement.getAttribute('srcPrefix') ?? '',
        extRefElement.getAttribute('srcLNClass') ?? 'LLN0',
        extRefElement.getAttribute('srcLNInst') ?? '',
        extRefElement.getAttribute('srcCBName') ?? '',
      );
    }

    return this.createSubscriptionCountKey(keyParts);
  }

  private buildSubscriptionCountIndex(): void {
    const subscriptionCountIndex = new Map<string, SubscriptionCountEntry>();
    if (!this.doc) {
      this.subscriptionCountIndex = subscriptionCountIndex;
      return;
    }

    const isEdition2003 = getSclSchemaVersion(this.doc) === '2003';
    const extRefElements = Array.from(
      this.doc.querySelectorAll('ExtRef'),
    ).filter(
      element =>
        !element.hasAttribute('intAddr') &&
        (isEdition2003 ||
          element.getAttribute('serviceType') ===
            serviceTypes[this.controlTag]),
    );

    extRefElements.forEach(extRefElement => {
      const key = this.getSubscriptionCountKeyForExtRef(extRefElement);
      const sinkIedName =
        extRefElement.closest('IED')?.getAttribute('name') ?? '';
      const existingEntry = subscriptionCountIndex.get(key) ?? {
        total: 0,
        bySinkIedName: new Map<string, number>(),
      };

      existingEntry.total += 1;
      existingEntry.bySinkIedName.set(
        sinkIedName,
        (existingEntry.bySinkIedName.get(sinkIedName) ?? 0) + 1,
      );
      subscriptionCountIndex.set(key, existingEntry);
    });

    this.subscriptionCountIndex = subscriptionCountIndex;
  }

  private getExtRefCount(
    fcdaElement: Element,
    controlElement: Element,
  ): number {
    const controlBlockFcdaId = `${identity(controlElement)} ${identity(
      fcdaElement,
    )}`;
    if (!this.extRefCounters.has(controlBlockFcdaId)) {
      const sourceIedName =
        fcdaElement.closest('IED')?.getAttribute('name') ?? '';
      const subscriptionCountEntry = this.subscriptionCountIndex.get(
        this.getSubscriptionCountKeyForFcda(fcdaElement, controlElement),
      );
      const extRefCount = subscriptionCountEntry
        ? subscriptionCountEntry.total -
          (subscriptionCountEntry.bySinkIedName.get(sourceIedName) ?? 0)
        : 0;
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
    if (!this.menuControlElement) {
      return;
    }
    this.dispatchEvent(newEditDialogEditEvent(this.menuControlElement));
  }

  private onMenuEditDataSet(): void {
    if (!this.menuControlElement) {
      return;
    }
    const dataSet = getAssociatedDataSet(this.menuControlElement);
    if (dataSet) {
      this.dispatchEvent(newEditDialogEditEvent(dataSet));
    }
  }

  private onMenuEditSmvOpts(): void {
    if (!this.menuControlElement) {
      return;
    }
    const smvOpts = getAssociatedSmvOpts(this.menuControlElement);
    if (smvOpts) {
      this.dispatchEvent(newEditDialogEditEvent(smvOpts));
    }
  }

  private onMenuEditCommunication(): void {
    if (!this.menuControlElement) {
      return;
    }
    const communication = getAssociatedCommunication(this.menuControlElement);
    if (communication) {
      this.dispatchEvent(newEditDialogEditEvent(communication));
    }
  }

  private onMenuRemove(): void {
    if (!this.menuControlElement) {
      return;
    }
    const edits = buildRemoveEdits(this.menuControlElement);
    if (edits.length > 0) {
      this.dispatchEvent(
        newEditEventV2(edits, {
          title: msg(removeActionTitle[this.controlTag]),
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

  protected willUpdate(_changedProperties: PropertyValues): void {
    super.willUpdate(_changedProperties);

    // Reset cached subscription counts before rendering against a new document
    // so Lit does not need to schedule a second update.
    if (
      _changedProperties.has('doc') ||
      _changedProperties.has('docVersion') ||
      _changedProperties.has('controlTag')
    ) {
      this.extRefCounters = new Map();
      this.buildSubscriptionCountIndex();
    }
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
  }

  renderFCDA(controlElement: Element, fcdaElement: Element): TemplateResult {
    const fcdaCount = this.getExtRefCount(fcdaElement, controlElement);

    const filterClasses = {
      subitem: true,
      'show-subscribed': fcdaCount !== 0,
      'show-not-subscribed': fcdaCount === 0,
      selected: this.selectedFcdaElement === fcdaElement,
    };

    return html`<oscd-list-item
      type="button"
      class="${classMap(filterClasses)}"
      style="inline-size: 100%;"
      @click=${() => this.onFcdaSelect(controlElement, fcdaElement)}
      data-value="${getFcdaTitleValue(fcdaElement)}
        ${getFcdaSubtitleValue(fcdaElement)}
        ${identity(controlElement)}
        ${identity(fcdaElement)}"
    >
      <div slot="headline">${getFcdaTitleValue(fcdaElement)}</div>
      <div slot="supporting-text">${getFcdaSubtitleValue(fcdaElement)}</div>
      <oscd-icon slot="start">subdirectory_arrow_right</oscd-icon>
      ${fcdaCount !== 0
        ? html`<span slot="end" class="fcda-count">${fcdaCount}</span>`
        : nothing}
    </oscd-list-item>`;
  }

  private onFilterDialogClose(event: FilterButtonDialogCloseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    const filterButton = event.target as HTMLElement & { items: SelectItem[] };
    this.hideSubscribed = !filterButton.items[0]?.selected;
    this.hideNotSubscribed = !filterButton.items[1]?.selected;
  }

  renderTitle(): TemplateResult {
    const menuClasses = {
      'filter-off': this.hideSubscribed || this.hideNotSubscribed,
    };
    return html`<h2>
      ${controlBlockListTitle[this.controlTag]}
      <oscd-filter-button
        class="actions-menu-icon ${classMap(menuClasses)}"
        .items=${this.filterItems}
        header="${msg('Filter')}"
        multiselect
        @filter-button-dialog-close=${(e: FilterButtonDialogCloseEvent) =>
          this.onFilterDialogClose(e)}
      ></oscd-filter-button>
    </h2> `;
  }

  private renderControlBlockMenu(): TemplateResult {
    const control = this.menuControlElement;
    const hasDataSet = control ? !!getAssociatedDataSet(control) : false;
    const hasCommunication = control
      ? !!getAssociatedCommunication(control)
      : false;
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
      ${this.controlTag === 'SampledValueControl' && hasSmvOpts
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

  private renderControlRow(row: ControlRow): TemplateResult {
    return html`
      <oscd-list-item
        class="control"
        style="inline-size: 100%;"
        data-value="${row.searchText}"
      >
        <oscd-icon-button
          slot="end"
          class="interactive"
          @click=${(e: Event) => this.openControlMenu(e, row.controlElement)}
          ><oscd-icon>more_vert</oscd-icon></oscd-icon-button
        >
        <div slot="headline">
          ${getNameAttribute(row.controlElement)}
          ${getDescriptionAttribute(row.controlElement)
            ? html`${getDescriptionAttribute(row.controlElement)}`
            : nothing}
        </div>
        <div slot="supporting-text">${identity(row.controlElement)}</div>
      </oscd-list-item>
    `;
  }

  private renderVirtualRow(row: VirtualRow): TemplateResult {
    return row.type === 'control'
      ? this.renderControlRow(row)
      : this.renderFCDA(row.controlElement, row.fcdaElement);
  }

  private matchesRowSearch(row: VirtualRow, regex: RegExp): boolean {
    return regex.test(row.searchText);
  }

  private buildVirtualRows(controlElements: Element[]): VirtualRow[] {
    const rows: VirtualRow[] = [];

    controlElements
      .filter(controlElement => this.getFcdaElements(controlElement).length)
      .forEach(controlElement => {
        const fcdaElements = this.getFcdaElements(controlElement);
        const fcdaRows = fcdaElements
          .map(fcdaElement => {
            const fcdaCount = this.getExtRefCount(fcdaElement, controlElement);
            const showSubscribed = fcdaCount !== 0;
            const matchesSubscriptionFilter =
              (!this.hideSubscribed && showSubscribed) ||
              (!this.hideNotSubscribed && !showSubscribed);

            if (!matchesSubscriptionFilter) {
              return null;
            }

            const searchText = `${getFcdaTitleValue(fcdaElement)}
              ${getFcdaSubtitleValue(fcdaElement)}
              ${identity(controlElement)}
              ${identity(fcdaElement)}`;

            return {
              type: 'fcda' as const,
              key: `fcda-${identity(controlElement)}-${identity(fcdaElement)}`,
              controlElement,
              fcdaElement,
              searchText,
            };
          })
          .filter((row): row is FcdaRow => row !== null);

        if (fcdaRows.length === 0) {
          return;
        }

        const searchText = `${identity(controlElement)}${fcdaElements
          .map(
            fcdaElement => `
              ${getFcdaTitleValue(fcdaElement)}
              ${getFcdaSubtitleValue(fcdaElement)}
              ${identity(fcdaElement)}`,
          )
          .join('')}`;

        rows.push({
          type: 'control',
          key: `control-${identity(controlElement)}`,
          controlElement,
          searchText,
        });
        rows.push(...fcdaRows);
      });

    return rows;
  }

  renderControls(controlElements: Element[]): TemplateResult {
    const rows = this.buildVirtualRows(controlElements);
    return html`<virtualized-filtered-list
      class="control-block-list"
      .items=${rows}
      .keyFunction=${(row: unknown) => (row as VirtualRow).key}
      .renderItem=${(row: unknown) => this.renderVirtualRow(row as VirtualRow)}
      .matchItem=${(row: unknown, regex: RegExp) =>
        this.matchesRowSearch(row as VirtualRow, regex)}
    ></virtualized-filtered-list>`;
  }

  render(): TemplateResult {
    const controlElements = this.getControlElements();
    return html`<section>
      ${this.renderTitle()}
      ${controlElements
        ? this.renderControls(controlElements)
        : html`<h4>${msg('Not Subscribed')}</h4> `}
      ${this.renderControlBlockMenu()}
    </section>`;
  }

  static styles = css`
    ${sharedStyles}

    .control-block-list {
      flex: 1 1 auto;
      min-height: 0;
    }

    section {
      position: relative;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .actions-menu-icon {
      float: right;
    }

    .actions-menu-icon.filter-off {
      color: var(--secondary);
      background-color: var(--mdc-theme-background);
    }
  `;
}
