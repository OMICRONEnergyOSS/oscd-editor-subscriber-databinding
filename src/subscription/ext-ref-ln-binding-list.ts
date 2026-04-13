import {
  css,
  html,
  LitElement,
  nothing,
  PropertyValues,
  TemplateResult,
} from 'lit';
import { property, state } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';

import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdListItem } from '@omicronenergy/oscd-ui/list/OscdListItem.js';
import { OscdDivider } from '@omicronenergy/oscd-ui/divider/OscdDivider.js';

import { identity, subscribe, unsubscribe } from '@openscd/scl-lib';
import type { EditV2 } from '@openscd/oscd-api';
import { newEditEventV2 } from '@openscd/oscd-api/utils.js';

import type { Nsdoc } from '../foundation/nsdoc.js';
import { VirtualizedFilteredList } from '../foundation/virtualized-filtered-list.js';

import {
  FcdaSelectEvent,
  getExtRef,
  getExistingSupervision,
  newSubscriptionChangedEvent,
  sharedStyles,
} from '../foundation/subscription.js';
import { getSubscribedExtRefElements } from '../foundation/subscription-later-binding.js';

interface SectionRow {
  type: 'section';
  key: string;
  headline: string;
}

interface DividerRow {
  type: 'divider';
  key: string;
}

interface EmptyRow {
  type: 'empty';
  key: string;
  headline: string;
}

interface SubscribedLnRow {
  type: 'subscribed-ln';
  key: string;
  lnElement: Element;
}

interface AvailableLnRow {
  type: 'available-ln';
  key: string;
  lnElement: Element;
}

type ExtRefVirtualRow =
  | SectionRow
  | DividerRow
  | EmptyRow
  | SubscribedLnRow
  | AvailableLnRow;

interface PartitionedLnElements {
  subscribed: Element[];
  available: Element[];
}

interface LnBindingGroupConfig<
  RowType extends 'subscribed-ln' | 'available-ln',
> {
  emptyHeadline: string;
  headline: string;
  keyPrefix: 'subscribed' | 'available';
  rowType: RowType;
  lnElements: Element[];
}

/**
 * A sub element for showing all Ext Refs from a FCDA Element.
 * The List reacts on a custom event to know which FCDA Element was selected and updated the view.
 */
export class ExtRefLnBindingList extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'oscd-icon': OscdIcon,
    'oscd-list-item': OscdListItem,
    'oscd-divider': OscdDivider,
    'virtualized-filtered-list': VirtualizedFilteredList,
  };

  @property({ attribute: false })
  doc!: XMLDocument;

  @property({ attribute: false })
  docVersion?: unknown;

  @property()
  nsdoc!: Nsdoc;

  @property()
  controlTag!: 'SampledValueControl' | 'GSEControl';

  @state()
  currentSelectedControlElement: Element | undefined;

  @state()
  currentSelectedFcdaElement: Element | undefined;

  @state()
  currentIedElement: Element | undefined;

  private boundFcdaSelectHandler = this.onFcdaSelectEvent.bind(this);

  private rowSearchValue(lnElement: Element): string {
    return `${this.buildLNTitle(lnElement)} ${identity(
      lnElement.closest('LDevice'),
    )} ${identity(lnElement)}`;
  }

  private matchesRowSearch(row: ExtRefVirtualRow, regex: RegExp): boolean {
    if (row.type === 'subscribed-ln' || row.type === 'available-ln') {
      return regex.test(this.rowSearchValue(row.lnElement));
    }

    return true;
  }

  override connectedCallback(): void {
    super.connectedCallback();

    const parentDiv = this.closest('.container');
    if (parentDiv) {
      parentDiv.addEventListener('fcda-select', this.boundFcdaSelectHandler);
    }
  }

  override disconnectedCallback(): void {
    const parentDiv = this.closest('.container');
    if (parentDiv) {
      parentDiv.removeEventListener('fcda-select', this.boundFcdaSelectHandler);
    }
    super.disconnectedCallback();
  }

  protected updated(_changedProperties: PropertyValues): void {
    super.updated(_changedProperties);

    if (_changedProperties.has('controlTag')) {
      this.currentSelectedControlElement = undefined;
      this.currentSelectedFcdaElement = undefined;
      this.currentIedElement = undefined;
    }
  }

  private getLNElements(): Element[] {
    if (this.doc) {
      return Array.from(
        this.doc.querySelectorAll('LDevice > LN0, LDevice > LN'),
      ).filter(element => element.closest('IED') !== this.currentIedElement);
    }

    return [];
  }

  private getPartitionedLNElements(): PartitionedLnElements {
    const subscribed: Element[] = [];
    const available: Element[] = [];

    for (const lnElement of this.getLNElements()) {
      if (this.getSubscribedExtRefs(lnElement, 'classification').length > 0) {
        subscribed.push(lnElement);
      } else {
        available.push(lnElement);
      }
    }

    return { subscribed, available };
  }

  private getSubscribedExtRefs(
    lnElement: Element,
    _phase: 'classification' | 'row',
  ): Element[] {
    return getSubscribedExtRefElements(
      lnElement,
      this.controlTag,
      this.currentSelectedFcdaElement,
      this.currentSelectedControlElement,
      false,
    );
  }

  private async onFcdaSelectEvent(event: FcdaSelectEvent) {
    this.currentSelectedControlElement = event.detail.control;
    this.currentSelectedFcdaElement = event.detail.fcda;

    this.currentIedElement = this.currentSelectedFcdaElement
      ? (this.currentSelectedFcdaElement.closest('IED') ?? undefined)
      : undefined;
  }

  private subscribeEdits(lnElement: Element): EditV2 | null {
    if (
      !this.currentIedElement ||
      !this.currentSelectedFcdaElement ||
      !this.currentSelectedControlElement!
    ) {
      return null;
    }

    const edits = subscribe({
      sink: lnElement,
      source: {
        fcda: this.currentSelectedFcdaElement,
        controlBlock: this.currentSelectedControlElement,
      },
    });

    return edits.length > 0 ? edits : null;
  }

  private unsubscribeEdits(lnElement: Element): EditV2 | null {
    if (
      !this.currentIedElement ||
      !this.currentSelectedFcdaElement ||
      !this.currentSelectedControlElement!
    ) {
      return null;
    }

    const inputElement = lnElement.querySelector(':scope > Inputs');
    if (!inputElement) {
      return null;
    }

    const extRefElement = getExtRef(
      inputElement,
      this.currentSelectedFcdaElement,
      this.currentSelectedControlElement,
    );
    if (!extRefElement) {
      return null;
    }

    const edits = unsubscribe([extRefElement]);

    return edits.length > 0 ? edits : null;
  }

  private bindingNotSupported(lnElement: Element): boolean {
    const iedElement = lnElement.closest('IED')!;
    return (
      (iedElement
        .querySelector(
          ':scope > AccessPoint > Services > ClientServices, :scope > Services > ClientServices',
        )
        ?.getAttribute('noIctBinding') ?? 'false') === 'true'
    );
  }

  private buildLNTitle(lnElement: Element): string {
    const prefix = lnElement.getAttribute('prefix');
    const inst = lnElement.getAttribute('inst');

    const data = this.nsdoc.getDataDescription(lnElement);

    return `${prefix ? `${prefix} - ` : ''}${data.label} ${
      inst ? ` - ${inst}` : ''
    }`;
  }

  private renderTitle(): TemplateResult {
    return html`<h2>
      ${msg('Logical nodes available for the selected FCDA')}
    </h2>`;
  }

  private renderEmptyState(): TemplateResult {
    return html`
      <div class="empty-state">
        <oscd-icon class="empty-state__icon">list_alt_check</oscd-icon>
        <h3 class="empty-state__title">${msg('No FCDA selected')}</h3>
        <p class="empty-state__description">
          ${msg(
            'Select an FCDA from the left-hand list to view subscribed and available logical nodes.',
          )}
        </p>
      </div>
    `;
  }

  private renderSubscribedLN(lnElement: Element): TemplateResult {
    const extRefs = this.getSubscribedExtRefs(lnElement, 'row');
    const supervisionNode = getExistingSupervision(extRefs[0]);
    return html`<oscd-list-item
      type="button"
      ?disabled=${this.bindingNotSupported(lnElement)}
      data-value="${identity(lnElement)}"
      @click=${() => {
        const edits = this.unsubscribeEdits(lnElement);
        if (edits) {
          this.dispatchEvent(
            newEditEventV2(edits, { title: msg('Disconnect data attribute') }),
          );
          this.dispatchEvent(
            newSubscriptionChangedEvent(
              this.currentSelectedControlElement,
              this.currentSelectedFcdaElement,
            ),
          );
        }
      }}
    >
      <div slot="headline">${this.buildLNTitle(lnElement)}</div>
      <div slot="supporting-text">
        ${identity(lnElement.closest('LDevice'))}
      </div>
      <oscd-icon slot="start">close</oscd-icon>
      ${supervisionNode !== null
        ? html`<oscd-icon title="${identity(supervisionNode)}" slot="end"
            >monitor_heart</oscd-icon
          >`
        : nothing}</oscd-list-item
    >`;
  }

  private renderAvailableLN(lnElement: Element): TemplateResult {
    return html`<oscd-list-item
      type="button"
      style="inline-size: 100%;"
      ?disabled=${this.bindingNotSupported(lnElement)}
      data-value="${identity(lnElement)}"
      @click=${() => {
        const edits = this.subscribeEdits(lnElement);
        if (edits) {
          this.dispatchEvent(
            newEditEventV2(edits, {
              title: msg('Connect data attribute'),
            }),
          );
          this.dispatchEvent(
            newSubscriptionChangedEvent(
              this.currentSelectedControlElement,
              this.currentSelectedFcdaElement,
            ),
          );
        }
      }}
    >
      <div slot="headline">${this.buildLNTitle(lnElement)}</div>
      <div slot="supporting-text">
        ${identity(lnElement.closest('LDevice'))}
      </div>
      <oscd-icon slot="start">add</oscd-icon>
    </oscd-list-item>`;
  }

  private buildLnBindingGroup<RowType extends 'subscribed-ln' | 'available-ln'>(
    config: LnBindingGroupConfig<RowType>,
  ): ExtRefVirtualRow[] {
    const result: ExtRefVirtualRow[] = [
      {
        type: 'section',
        key: `${config.keyPrefix}-header`,
        headline: config.headline,
      },
      {
        type: 'divider',
        key: `${config.keyPrefix}-divider`,
      },
    ];

    if (config.lnElements.length > 0) {
      result.push(
        ...config.lnElements.map(
          lnElement =>
            ({
              type: config.rowType,
              key: `${config.keyPrefix}-${identity(lnElement)}`,
              lnElement,
            }) as ExtRefVirtualRow,
        ),
      );
    } else {
      result.push({
        type: 'empty',
        key: `${config.keyPrefix}-empty`,
        headline: config.emptyHeadline,
      });
    }

    return result;
  }

  private buildSubscribedLnGroup(subscribedLNs: Element[]): ExtRefVirtualRow[] {
    return this.buildLnBindingGroup({
      emptyHeadline: msg('No subscribed logical nodes'),
      headline: msg('Subscribed'),
      keyPrefix: 'subscribed',
      rowType: 'subscribed-ln',
      lnElements: subscribedLNs,
    });
  }

  private buildAvailableLnGroup(availableLNs: Element[]): ExtRefVirtualRow[] {
    return this.buildLnBindingGroup({
      emptyHeadline: msg('No available logical nodes to subscribe'),
      headline: msg('Available to subscribe'),
      keyPrefix: 'available',
      rowType: 'available-ln',
      lnElements: availableLNs,
    });
  }

  private renderVirtualRow(row: ExtRefVirtualRow): TemplateResult {
    if (row.type === 'section') {
      return html`<oscd-list-item style="inline-size: 100%;">
        <div slot="headline">${row.headline}</div>
      </oscd-list-item>`;
    }

    if (row.type === 'divider') {
      return html`<oscd-divider style="inline-size: 100%;"></oscd-divider>`;
    }

    if (row.type === 'empty') {
      return html`<oscd-list-item style="inline-size: 100%;">
        <div slot="headline">${row.headline}</div>
      </oscd-list-item>`;
    }

    return row.type === 'subscribed-ln'
      ? this.renderSubscribedLN(row.lnElement)
      : this.renderAvailableLN(row.lnElement);
  }

  render(): TemplateResult {
    const partitionedLNs =
      this.currentSelectedControlElement && this.currentSelectedFcdaElement
        ? this.getPartitionedLNElements()
        : null;
    const rows = partitionedLNs
      ? [
          ...this.buildSubscribedLnGroup(partitionedLNs.subscribed),
          ...this.buildAvailableLnGroup(partitionedLNs.available),
        ]
      : [];

    return html` <section>
      ${this.currentSelectedControlElement && this.currentSelectedFcdaElement
        ? html`
            ${this.renderTitle()}
            <virtualized-filtered-list
              class="list-container"
              .items=${rows}
              .keyFunction=${(row: unknown) => (row as ExtRefVirtualRow).key}
              .renderItem=${(row: unknown) =>
                this.renderVirtualRow(row as ExtRefVirtualRow)}
              .matchItem=${(row: unknown, regex: RegExp) =>
                this.matchesRowSearch(row as ExtRefVirtualRow, regex)}
            ></virtualized-filtered-list>
          `
        : this.renderEmptyState()}
    </section>`;
  }

  static styles = css`
    ${sharedStyles}

    section {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .list-container {
      flex: 1 1 auto;
      min-height: 0;
    }

    .empty-state {
      font-family: var(--oscd-font-family, 'Roboto', sans-serif);
      min-height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 12px;
      padding: 32px 24px;
      box-sizing: border-box;
      background-color: var(--oscd-base2);
    }

    .empty-state__icon {
      font-size: 128px;
      inline-size: 128px;
      block-size: 128px;
      line-height: 1;
      color: var(--oscd-base01);
      opacity: 0.7;
    }

    .empty-state__title {
      margin: 0;
      font-size: 1.125rem;
      line-height: 1.4;
      font-weight: 500;
      color: var(--oscd-base01);
    }

    .empty-state__description {
      margin: 0;
      max-width: 32rem;
      font-size: 0.95rem;
      line-height: 1.5;
      color: var(
        --oscd-base01,
        var(--md-sys-color-on-surface-variant, #49454f)
      );
    }
  `;
}
