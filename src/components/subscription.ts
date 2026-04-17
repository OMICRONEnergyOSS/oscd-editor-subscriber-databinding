import { css, LitElement } from 'lit';
import { query } from 'lit/decorators.js';

import { compareNames, getSclSchemaVersion } from '../foundation/scl.js';

import { getFcdaReferences } from '../foundation/ied.js';

export enum View {
  PUBLISHER,
  SUBSCRIBER,
}

/**
 * Enumeration stating the Subscribe status of a IED to a GOOSE or Sampled Value.
 */
export enum SubscribeStatus {
  Full,
  Partial,
  None,
}

export interface ViewDetail {
  view: View;
}
export type ViewEvent = CustomEvent<ViewDetail>;
export function newViewEvent(
  view: View,
  eventInitDict?: CustomEventInit<ViewDetail>,
): ViewEvent {
  return new CustomEvent<ViewDetail>('view', {
    bubbles: true,
    composed: true,
    ...eventInitDict,
    detail: { view, ...eventInitDict?.detail },
  });
}

export interface IEDSelectDetail {
  ied: Element | undefined;
}
export type IEDSelectEvent = CustomEvent<IEDSelectDetail>;
export function newIEDSelectEvent(
  ied: Element | undefined,
  eventInitDict?: CustomEventInit<IEDSelectDetail>,
): IEDSelectEvent {
  return new CustomEvent<IEDSelectDetail>('ied-select', {
    bubbles: true,
    composed: true,
    ...eventInitDict,
    detail: { ied, ...eventInitDict?.detail },
  });
}

export interface FcdaSelectDetail {
  control: Element | undefined;
  fcda: Element | undefined;
}
export type FcdaSelectEvent = CustomEvent<FcdaSelectDetail>;
export function newFcdaSelectEvent(
  control: Element | undefined,
  fcda: Element | undefined,
  eventInitDict?: CustomEventInit<FcdaSelectDetail>,
): FcdaSelectEvent {
  return new CustomEvent<FcdaSelectDetail>('fcda-select', {
    bubbles: true,
    composed: true,
    ...eventInitDict,
    detail: { control, fcda, ...eventInitDict?.detail },
  });
}

export interface SubscriptionChangedDetail {
  control: Element | undefined;
  fcda: Element | undefined;
}
export type SubscriptionChangedEvent = CustomEvent<SubscriptionChangedDetail>;
export function newSubscriptionChangedEvent(
  control: Element | undefined,
  fcda: Element | undefined,
  eventInitDict?: CustomEventInit<SubscriptionChangedDetail>,
): SubscriptionChangedEvent {
  return new CustomEvent<SubscriptionChangedDetail>('subscription-changed', {
    bubbles: true,
    composed: true,
    ...eventInitDict,
    detail: { control, fcda, ...eventInitDict?.detail },
  });
}

export function getFcdaTitleValue(fcdaElement: Element): string {
  return `${fcdaElement.getAttribute('doName')}${
    fcdaElement.hasAttribute('doName') && fcdaElement.hasAttribute('daName')
      ? `.`
      : ``
  }${fcdaElement.getAttribute('daName')}`;
}

export function getFcdaSubtitleValue(fcdaElement: Element): string {
  return `${fcdaElement.getAttribute('ldInst')} ${
    fcdaElement.hasAttribute('ldInst') ? `/` : ''
  }${
    fcdaElement.getAttribute('prefix')
      ? ` ${fcdaElement.getAttribute('prefix')}`
      : ''
  } ${fcdaElement.getAttribute('lnClass')} ${fcdaElement.getAttribute(
    'lnInst',
  )}`;
}

export function getExtRef(
  parentInputs: Element,
  fcda: Element,
  control: Element | undefined,
): Element | undefined {
  function createCriteria(attributeName: string, value: string | null): string {
    // For ExtRef the attribute 'srcLNClass' is optional and defaults to 'LLN0', here we ignore 'srcLNClass' completely for 'LLN0'
    // because otherwise we would have to extend the querySelector to multiple selector groups checking for 'LLN0' or missing 'srcLNClass'
    const shouldIgnoreCriteria =
      attributeName === 'srcLNClass' && value === 'LLN0';
    if (shouldIgnoreCriteria) {
      return '';
    }

    if (value) {
      return `[${attributeName}="${value}"]`;
    }
    return '';
  }

  const iedName = fcda.closest('IED')?.getAttribute('name');
  if (!iedName) {
    return undefined;
  }

  let controlCriteria = '';
  if (control && getSclSchemaVersion(fcda.ownerDocument) !== '2003') {
    controlCriteria = `[serviceType="${serviceTypes[control.tagName]!}"]`;
    controlCriteria += createCriteria(
      'srcLDInst',
      control.closest('LDevice')?.getAttribute('inst') ?? null,
    );
    controlCriteria += createCriteria(
      'srcLNClass',
      control.closest('LN0,LN')?.getAttribute('lnClass') ?? null,
    );
    controlCriteria += createCriteria(
      'srcLNInst',
      control.closest('LN0,LN')?.getAttribute('inst') ?? null,
    );
    controlCriteria += createCriteria(
      'srcCBName',
      control.getAttribute('name') ?? null,
    );
  }

  return Array.from(
    parentInputs.querySelectorAll(
      `ExtRef[iedName="${iedName}"]${getFcdaReferences(fcda)}${controlCriteria}`,
    ),
  ).find(extRefElement => !extRefElement.hasAttribute('intAddr'));
}

/**
 * Return Val elements within an LGOS/LSVS instance for a particular IED and control block type.
 * @param ied - IED SCL element.
 * @param cbTagName - Either GSEControl or (defaults to) SampledValueControl.
 * @param firstOnly - If true, return the first element found
 * @returns an Element array of Val SCL elements within an LGOS/LSVS node.
 */
export function getSupervisionCbRefs(
  ied: Element,
  cbTagName: string,
): Element[];
export function getSupervisionCbRefs(
  ied: Element,
  cbTagName: string,
  firstOnly: boolean,
): Element | null;
export function getSupervisionCbRefs(
  ied: Element,
  cbTagName: string,
  firstOnly?: boolean,
): Element[] | Element | null {
  const supervisionType = cbTagName === 'GSEControl' ? 'LGOS' : 'LSVS';
  const supervisionName = supervisionType === 'LGOS' ? 'GoCBRef' : 'SvCBRef';
  const selectorString = `LN[lnClass="${supervisionType}"]>DOI[name="${supervisionName}"]>DAI[name="setSrcRef"]>Val,LN0[lnClass="${supervisionType}"]>DOI[name="${supervisionName}"]>DAI[name="setSrcRef"]>Val`;
  return firstOnly
    ? ied.querySelector(selectorString)
    : Array.from(ied.querySelectorAll(selectorString));
}

/** Returns the subscriber's supervision LN for a given control block and extRef element
 *
 * @param extRef - The extRef SCL element in the subscribing IED.
 * @returns The supervision LN instance or null if not found
 */
export function getExistingSupervision(extRef: Element | null): Element | null {
  if (extRef === null) {
    return null;
  }

  const extRefValues = ['iedName', 'serviceType', 'srcPrefix', 'srcCBName'];
  const [srcIedName, serviceType, srcPrefix, srcCBName] = extRefValues.map(
    attr => extRef.getAttribute(attr) ?? '',
  );

  const supervisionType = serviceType === 'GOOSE' ? 'LGOS' : 'LSVS';
  const refSelector =
    supervisionType === 'LGOS' ? 'DOI[name="GoCBRef"]' : 'DOI[name="SvCBRef"]';

  const srcLDInst =
    extRef.getAttribute('srcLDInst') ?? extRef.getAttribute('ldInst');
  const srcLNClass = extRef.getAttribute('srcLNClass') ?? 'LLN0';

  const cbReference = `${srcIedName}${srcPrefix}${srcLDInst}/${srcLNClass}.${srcCBName}`;
  const iedName = extRef.closest('IED')?.getAttribute('name');

  const candidates = Array.from(
    extRef.ownerDocument
      .querySelector(`IED[name="${iedName}"]`)!
      .querySelectorAll(
        `LN[lnClass="${supervisionType}"]>${refSelector}>DAI[name="setSrcRef"]>Val`,
      ),
  ).find(val => val.textContent === cbReference);

  return candidates !== undefined ? candidates.closest('LN')! : null;
}

export const serviceTypes: Partial<Record<string, string>> = {
  ReportControl: 'Report',
  GSEControl: 'GOOSE',
  SampledValueControl: 'SMV',
};

export function getOrderedIeds(doc: XMLDocument): Element[] {
  return doc
    ? Array.from(doc.querySelectorAll(':root > IED')).sort((a, b) =>
        compareNames(a, b),
      )
    : [];
}

/**
 * An element within this list has 2 properties:
 * - The element itself, either a GSEControl or an IED at this point.
 * - A 'partial' property indicating if the GOOSE is fully initialized or partially.
 */
export interface ListElement {
  element: Element;
  partial?: boolean;
}

export class SubscriberListContainer extends LitElement {
  /** List holding all current subscribed Elements. */
  subscribedElements: ListElement[] = [];

  /** List holding all current available Elements which are not subscribed. */
  availableElements: ListElement[] = [];

  /** Current selected IED (when in Subscriber view) */
  currentSelectedIed: Element | undefined;

  /** The current used dataset for subscribing / unsubscribing */
  currentUsedDataset: Element | undefined | null;

  @query('div') subscriberWrapper!: Element;

  protected updated(): void {
    if (this.subscriberWrapper) {
      this.subscriberWrapper.scrollTo(0, 0);
    }
  }

  protected resetElements(): void {
    this.subscribedElements = [];
    this.availableElements = [];
  }
}

/** Common `CSS` styles used by DataTypeTemplate subeditors */
export const sharedStyles = css`
  section {
    background-color: var(--mdc-theme-surface);
    transition: all 200ms linear;
    outline-color: var(--mdc-theme-primary);
    outline-style: solid;
    outline-width: 0px;
    opacity: 1;
  }

  h2 {
    color: var(--md-sys-color-on-surface);
    font-family: 'Roboto', sans-serif;
    font-weight: 300;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    margin: 0px;
    line-height: 48px;
    padding-left: 0.3em;
    transition: background-color 150ms linear;
  }

  abbr[title] {
    border-bottom: none !important;
    cursor: inherit !important;
    text-decoration: none !important;
  }

  oscd-list-item.control > div[slot='headline'] {
    font-weight: 500;
  }
`;

declare global {
  interface ElementEventMap {
    ['fcda-select']: FcdaSelectEvent;
  }
}
