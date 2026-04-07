import { css, html, LitElement, TemplateResult } from 'lit';
import { property, query } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';

import OscdSclDialogs from '@omicronenergy/oscd-scl-dialogs/OscdSclDialogs.js';

import { Nsdoc, initializeNsdoc } from './foundation/nsdoc.js';

import { FcdaBindingList } from './subscription/fcda-binding-list.js';
import { ExtRefLnBindingList } from './subscription/later-binding/ext-ref-ln-binding-list.js';

/** An editor plugin for Subscribe Data Binding (SMV). */
export default class OscdEditorSubscriberDatabinding extends ScopedElementsMixin(
  LitElement,
) {
  static scopedElements = {
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

  render(): TemplateResult {
    return html`<div>
      <div class="container">
        <fcda-binding-list
          class="column"
          controlTag="SampledValueControl"
          .includeLaterBinding="${false}"
          .docVersion=${this.docVersion}
          .doc="${this.doc}"
        >
        </fcda-binding-list>
        <extref-ln-binding-list
          class="column"
          controlTag="SampledValueControl"
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
    :host {
      width: 100vw;
    }

    .container {
      display: flex;
      padding: 8px 6px 16px;
      height: calc(100vh - 136px);
    }

    .column {
      flex: 50%;
      margin: 0px 6px 0px;
      min-width: 300px;
      height: 100%;
      overflow-y: auto;
    }
  `;
}
