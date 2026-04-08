import { css, html, LitElement, nothing, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';

import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdListItem } from '@omicronenergy/oscd-ui/list/OscdListItem.js';
import { OscdDivider } from '@omicronenergy/oscd-ui/divider/OscdDivider.js';

import { identity, subscribe, unsubscribe } from '@openscd/scl-lib';
import type { EditV2 } from '@openscd/oscd-api';
import { newEditEventV2 } from '@openscd/oscd-api/utils.js';

import type { Nsdoc } from '../../foundation/nsdoc.js';
import { FilteredList } from '../../foundation/filtered-list.js';

import {
  FcdaSelectEvent,
  getExtRef,
  getExistingSupervision,
  newSubscriptionChangedEvent,
  styles,
} from '../../foundation/subscription.js';
import { getSubscribedExtRefElements } from '../../foundation/subscription-later-binding.js';

/**
 * A sub element for showing all Ext Refs from a FCDA Element.
 * The List reacts on a custom event to know which FCDA Element was selected and updated the view.
 */
export class ExtRefLnBindingList extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'filtered-list': FilteredList,
    'oscd-icon': OscdIcon,
    'oscd-list-item': OscdListItem,
    'oscd-divider': OscdDivider,
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

  override connectedCallback(): void {
    super.connectedCallback();

    // In legacy, this ran in the constructor where global registration meant
    // the element was already in the DOM. With ScopedElementsMixin the
    // constructor runs before the element is connected, so
    // this.closest('.container') would return null. We move it here.
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

  private getLNElements(): Element[] {
    if (this.doc) {
      return Array.from(
        this.doc.querySelectorAll('LDevice > LN0, LDevice > LN'),
      ).filter(element => element.closest('IED') !== this.currentIedElement);
    }
    return [];
  }

  private getSubscribedLNElements(): Element[] {
    return this.getLNElements().filter(
      element =>
        getSubscribedExtRefElements(
          element,
          this.controlTag,
          this.currentSelectedFcdaElement,
          this.currentSelectedControlElement,
          false,
        ).length > 0,
    );
  }

  private getAvailableLNElements(): Element[] {
    return this.getLNElements().filter(
      element =>
        getSubscribedExtRefElements(
          element,
          this.controlTag,
          this.currentSelectedFcdaElement,
          this.currentSelectedControlElement,
          false,
        ).length == 0,
    );
  }

  private async onFcdaSelectEvent(event: FcdaSelectEvent) {
    this.currentSelectedControlElement = event.detail.control;
    this.currentSelectedFcdaElement = event.detail.fcda;

    // Retrieve the IED Element to which the FCDA belongs.
    // These LN Elements will be excluded.
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
    return html`<h1>
      ${msg('Logical nodes available for selected data attribute')}
    </h1>`;
  }

  private renderSubscribedLN(lnElement: Element): TemplateResult {
    const extRefs = getSubscribedExtRefElements(
      lnElement,
      this.controlTag,
      this.currentSelectedFcdaElement,
      this.currentSelectedControlElement,
      false,
    );
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

  private renderSubscribedLNs(): TemplateResult {
    const subscribedLNs = this.getSubscribedLNElements();
    return html`
      <oscd-list-item
        data-value="${subscribedLNs
          .map(
            lnElement =>
              this.buildLNTitle(lnElement) +
              ' ' +
              identity(lnElement.closest('LDevice')),
          )
          .join(' ')}"
      >
        <div slot="headline">${msg('Subscribed')}</div>
      </oscd-list-item>
      <oscd-divider></oscd-divider>
      ${subscribedLNs.length > 0
        ? html`${subscribedLNs.map(lN => this.renderSubscribedLN(lN))}`
        : html`<oscd-list-item>
            <div slot="headline">${msg('No subscribed logical nodes')}</div>
          </oscd-list-item>`}
    `;
  }

  private renderAvailableLNs(): TemplateResult {
    const availableLNs = this.getAvailableLNElements();
    return html`
      <oscd-list-item
        data-value="${availableLNs
          .map(
            lnElement =>
              this.buildLNTitle(lnElement) +
              ' ' +
              identity(lnElement.closest('LDevice')),
          )
          .join(' ')}"
      >
        <div slot="headline">${msg('Available to subscribe')}</div>
      </oscd-list-item>
      <oscd-divider></oscd-divider>
      ${availableLNs.length > 0
        ? html`${availableLNs.map(
            lnElement =>
              html` <oscd-list-item
                type="button"
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
              </oscd-list-item>`,
          )}`
        : html`<oscd-list-item>
            <div slot="headline">
              ${msg('No available logical nodes to subscribe')}
            </div>
          </oscd-list-item>`}
    `;
  }

  render(): TemplateResult {
    return html` <section tabindex="0">
      ${this.currentSelectedControlElement && this.currentSelectedFcdaElement
        ? html`
            ${this.renderTitle()}
            <filtered-list>
              ${this.renderSubscribedLNs()} ${this.renderAvailableLNs()}
            </filtered-list>
          `
        : html` <h1>${msg('No data attribute selected')}</h1> `}
    </section>`;
  }

  static styles = css`
    ${styles}

    oscd-list-item.hidden:not([type='button']) + oscd-divider {
      display: none;
    }
  `;
}
