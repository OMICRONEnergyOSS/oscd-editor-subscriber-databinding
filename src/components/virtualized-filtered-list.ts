import { css, html, LitElement, TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { virtualize } from '@lit-labs/virtualizer/virtualize.js';

import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import { OscdList } from '@omicronenergy/oscd-ui/list/OscdList.js';
import { OscdListItem } from '@omicronenergy/oscd-ui/list/OscdListItem.js';
import { OscdDivider } from '@omicronenergy/oscd-ui/divider/OscdDivider.js';
import { OscdOutlinedTextField } from '@omicronenergy/oscd-ui/textfield/OscdOutlinedTextField.js';

function searchRegex(filter?: string): RegExp {
  if (!filter) {
    return /.*/i;
  }

  const terms: string[] =
    filter
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .trim()
      .match(/(?:[^\s"']+|['"][^'"]*["'])+/g) ?? [];

  const expanded = terms.map(t =>
    t.replace(/\*/g, '.*').replace(/\?/g, '.{1}').replace(/"|'/g, ''),
  );

  return new RegExp(`${expanded.map(t => `(?=.*${t})`).join('')}.*`, 'i');
}

export class VirtualizedFilteredList extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'oscd-icon': OscdIcon,
    'oscd-icon-button': OscdIconButton,
    'oscd-list': OscdList,
    'oscd-list-item': OscdListItem,
    'oscd-divider': OscdDivider,
    'oscd-outlined-text-field': OscdOutlinedTextField,
  };

  @property({ attribute: false })
  items: unknown[] = [];

  @property({ attribute: false })
  renderItem: (item: unknown) => TemplateResult = () => html``;

  @property({ attribute: false })
  keyFunction: (item: unknown) => string = item => String(item);

  @property({ attribute: false })
  matchItem: (item: unknown, regex: RegExp) => boolean = () => true;

  @property()
  placeholder = 'search';

  @state()
  private searchValue = '';

  @query('oscd-outlined-text-field')
  private searchField?: HTMLElement & { value: string };

  private onInput(): void {
    if (this.searchField) {
      this.searchValue = this.searchField.value;
    }
  }

  private clearSearch(): void {
    this.searchValue = '';
    if (this.searchField) {
      this.searchField.value = '';
      this.searchField.focus();
    }
  }

  private get filteredItems(): unknown[] {
    const regex = searchRegex(this.searchValue);
    return this.items.filter(item => this.matchItem(item, regex));
  }

  render(): TemplateResult {
    return html`
      <div class="filter-container">
        <oscd-outlined-text-field
          .value=${this.searchValue}
          placeholder=${this.placeholder}
          @input=${() => this.onInput()}
        >
          <oscd-icon slot="leading-icon">search</oscd-icon>
          ${this.searchValue
            ? html`<oscd-icon-button
                slot="trailing-icon"
                @click=${() => this.clearSearch()}
                aria-label="Clear search"
                title="Clear search"
              >
                <oscd-icon>close</oscd-icon>
              </oscd-icon-button>`
            : html``}
        </oscd-outlined-text-field>
        <oscd-list class="virtualized-list">
          ${virtualize({
            items: this.filteredItems,
            keyFunction: (item: unknown) => this.keyFunction(item),
            renderItem: (item: unknown) => this.renderItem(item),
            scroller: true,
          })}
        </oscd-list>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      min-height: 0;
      height: 100%;
    }

    .filter-container {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      min-height: 0;
      height: 100%;
    }

    oscd-outlined-text-field {
      margin: 8px;
    }

    .virtualized-list {
      flex: 1 1 auto;
      min-height: 0;
    }

    oscd-list-item.selected {
      --md-sys-color-on-surface: var(--oscd-base3);
      --md-sys-color-on-surface-variant: var(--oscd-base2);
      background-color: var(--oscd-primary);
    }

    oscd-list-item.control > div[slot='headline'] {
      font-weight: 500;
    }

    .fcda-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-inline-size: 40px;
      block-size: 40px;
      padding: 0 8px;
      box-sizing: border-box;
      font-variant-numeric: tabular-nums;
      text-align: center;
    }

    .interactive {
      pointer-events: all;
    }
  `;
}
