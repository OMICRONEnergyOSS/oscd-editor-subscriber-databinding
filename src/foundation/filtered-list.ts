import { css, html, LitElement, TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';

import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdList } from '@omicronenergy/oscd-ui/list/OscdList.js';
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

/**
 * A slot-based filterable list. Renders a search input above an `<oscd-list>`
 * and hides slotted items whose text content does not match the search query.
 *
 * Items can provide searchable text via their `data-value` attribute or via
 * their `textContent`. Items without either are always shown.
 */
export class FilteredList extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'oscd-icon': OscdIcon,
    'oscd-list': OscdList,
    'oscd-outlined-text-field': OscdOutlinedTextField,
  };

  /** Not used functionally but preserved for API compatibility with legacy callers. */
  @property({ type: Boolean })
  activatable = false;

  @state()
  private searchValue = '';

  @query('oscd-outlined-text-field')
  private searchField?: HTMLElement & { value: string };

  private onInput(): void {
    if (this.searchField) {
      this.searchValue = this.searchField.value;
    }
  }

  private applyFilter(): void {
    const regex = searchRegex(this.searchValue);
    const slot = this.shadowRoot?.querySelector('slot:not([name])');
    if (!slot) {
      return;
    }

    const items = Array.from(
      (slot as HTMLSlotElement).assignedElements({ flatten: true }),
    );
    items.forEach(item => {
      const itemElement = item as HTMLElement;
      const explicitSearchText = itemElement.dataset?.['value'] ?? '';
      const itemText = itemElement.innerText ?? itemElement.textContent ?? '';
      const childText = Array.from(itemElement.children)
        .map(
          child => (child as HTMLElement).innerText ?? child.textContent ?? '',
        )
        .join(' ');
      const searchText = `${explicitSearchText} ${itemText} ${childText}`;
      const match = regex.test(searchText);
      itemElement.classList.toggle('hidden', !match);
    });
  }

  protected override updated(): void {
    this.applyFilter();
  }

  render(): TemplateResult {
    return html`
      <div class="filter-container">
        <oscd-outlined-text-field
          .value=${this.searchValue}
          placeholder="search"
          @input=${() => this.onInput()}
        >
          <oscd-icon slot="leading-icon">search</oscd-icon>
        </oscd-outlined-text-field>
        <oscd-list>
          <slot @slotchange=${() => this.applyFilter()}></slot>
        </oscd-list>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }

    .filter-container {
      display: flex;
      flex-direction: column;
    }

    oscd-outlined-text-field {
      margin: 8px;
    }

    ::slotted(.hidden) {
      display: none;
    }
  `;
}
