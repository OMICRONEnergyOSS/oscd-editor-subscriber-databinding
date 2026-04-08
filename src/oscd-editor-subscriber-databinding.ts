import { css, html, LitElement, TemplateResult } from 'lit';
import { property, query } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';

import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import OscdSclDialogs from '@omicronenergy/oscd-scl-dialogs/OscdSclDialogs.js';
import { OscdOutlinedSegmentedButton } from '@omicronenergy/oscd-ui/labs/segmentedbutton/OscdOutlinedSegmentedButton.js';
import { OscdOutlinedSegmentedButtonSet } from '@omicronenergy/oscd-ui/labs/segmentedbuttonset/OscdOutlinedSegmentedButtonSet.js';

import { Nsdoc, initializeNsdoc } from './foundation/nsdoc.js';

import { FcdaBindingList } from './subscription/fcda-binding-list.js';
import { ExtRefLnBindingList } from './subscription/later-binding/ext-ref-ln-binding-list.js';

type ControlTag = 'GSEControl' | 'SampledValueControl';

const viewStorageKey = 'oscd-editor-subscriber-databinding$controlTag';

/** An editor plugin for GOOSE and SMV subscriber data binding. */
export default class OscdEditorSubscriberDatabinding extends ScopedElementsMixin(
  LitElement,
) {
  static scopedElements = {
    'oscd-icon': OscdIcon,
    'oscd-outlined-segmented-button': OscdOutlinedSegmentedButton,
    'oscd-outlined-segmented-button-set': OscdOutlinedSegmentedButtonSet,
    'fcda-binding-list': FcdaBindingList,
    'extref-ln-binding-list': ExtRefLnBindingList,
    'oscd-scl-dialogs': OscdSclDialogs,
  };

  @property({ attribute: false })
  doc!: XMLDocument;

  @property({ attribute: false })
  docVersion?: unknown;

  @property({ attribute: false })
  nsdoc: Nsdoc = initializeNsdoc();

  @property({ type: String })
  controlTag: ControlTag =
    (localStorage.getItem(viewStorageKey) as ControlTag | null) ??
    'SampledValueControl';

  @query('oscd-scl-dialogs')
  private sclDialogs!: OscdSclDialogs;

  private handleEditDialogEvent = (event: Event): void => {
    event.stopPropagation();
    const detail = (event as CustomEvent).detail;
    this.sclDialogs.edit(detail);
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('oscd-scl-dialogs-edit', this.handleEditDialogEvent);
  }

  override disconnectedCallback(): void {
    this.removeEventListener(
      'oscd-scl-dialogs-edit',
      this.handleEditDialogEvent,
    );
    super.disconnectedCallback();
  }

  private onControlTagChange(controlTag: ControlTag): void {
    this.controlTag = controlTag;
    localStorage.setItem(viewStorageKey, controlTag);
  }

  render(): TemplateResult {
    return html`<div>
      <header class="header">
        <oscd-outlined-segmented-button-set class="control-switch">
          <oscd-outlined-segmented-button
            label="${msg('GOOSE')}"
            no-checkmark
            ?selected=${this.controlTag === 'GSEControl'}
            @click=${() => this.onControlTagChange('GSEControl')}
          >
            <oscd-icon slot="icon">gooseIcon</oscd-icon>
          </oscd-outlined-segmented-button>
          <oscd-outlined-segmented-button
            label="${msg('Sampled Values')}"
            no-checkmark
            ?selected=${this.controlTag === 'SampledValueControl'}
            @click=${() => this.onControlTagChange('SampledValueControl')}
          >
            <oscd-icon slot="icon">smvIcon</oscd-icon>
          </oscd-outlined-segmented-button>
        </oscd-outlined-segmented-button-set>
      </header>
      <div class="container">
        <fcda-binding-list
          class="column"
          controlTag=${this.controlTag}
          .includeLaterBinding="${false}"
          .docVersion=${this.docVersion}
          .doc="${this.doc}"
        >
        </fcda-binding-list>
        <extref-ln-binding-list
          class="column"
          controlTag=${this.controlTag}
          .docVersion=${this.docVersion}
          .doc="${this.doc}"
          .nsdoc="${this.nsdoc}"
        >
        </extref-ln-binding-list>
      </div>
      <oscd-scl-dialogs></oscd-scl-dialogs>
    </div>`;
  }

  static styles = css`
    .header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 8px 12px 0;
      flex-wrap: wrap;
    }

    .title-group {
      min-width: 0;
      flex: 1;
    }

    .title-group h1 {
      margin: 0;
      font-size: 1.25rem;
      line-height: 1.4;
      color: var(--mdc-theme-on-surface);
      font-weight: 400;
    }

    .title-group p {
      margin: 4px 0 0;
      color: var(--mdc-theme-text-secondary-on-background, #5f6368);
      font-size: 0.9rem;
      line-height: 1.35;
    }

    .control-switch {
      flex-shrink: 0;
      align-self: flex-start;
      inline-size: min(100%, 28rem);
      --md-outlined-segmented-button-selected-container-color: var(
        --md-sys-color-primary,
        #005ac1
      );
      --md-outlined-segmented-button-selected-label-text-color: var(
        --md-sys-color-on-primary,
        #ffffff
      );
      --md-outlined-segmented-button-selected-icon-color: var(
        --md-sys-color-on-primary,
        #ffffff
      );
      --md-outlined-segmented-button-selected-hover-label-text-color: var(
        --md-sys-color-on-primary,
        #ffffff
      );
      --md-outlined-segmented-button-selected-hover-icon-color: var(
        --md-sys-color-on-primary,
        #ffffff
      );
      --md-outlined-segmented-button-selected-focus-label-text-color: var(
        --md-sys-color-on-primary,
        #ffffff
      );
      --md-outlined-segmented-button-selected-focus-icon-color: var(
        --md-sys-color-on-primary,
        #ffffff
      );
      --md-outlined-segmented-button-selected-pressed-label-text-color: var(
        --md-sys-color-on-primary,
        #ffffff
      );
      --md-outlined-segmented-button-selected-pressed-icon-color: var(
        --md-sys-color-on-primary,
        #ffffff
      );
      --md-outlined-segmented-button-selected-hover-state-layer-color: var(
        --md-sys-color-on-primary,
        #ffffff
      );
      --md-outlined-segmented-button-selected-pressed-state-layer-color: var(
        --md-sys-color-on-primary,
        #ffffff
      );
    }

    .control-switch oscd-outlined-segmented-button {
      min-inline-size: 0;
    }

    .container {
      display: flex;
      padding: 8px 6px 16px;
      height: calc(100vh - 136px);
      gap: 12px;
    }

    .column {
      flex: 1 1 0;
      width: 100%;
      min-width: 0;
      height: 100%;
      overflow-y: auto;
    }

    @media (max-width: 900px) {
      .container {
        flex-direction: column;
        height: auto;
      }

      .column {
        width: 100%;
        min-height: 24rem;
      }
    }
  `;
}
