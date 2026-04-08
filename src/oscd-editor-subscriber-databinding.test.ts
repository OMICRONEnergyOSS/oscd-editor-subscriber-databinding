import { fixture, html } from '@open-wc/testing';
import { setViewport } from '@web/test-runner-commands';

// import { visualDiff } from '@web/test-runner-visual-regression';

import OscdEditorSubscriberDatabinding from './oscd-editor-subscriber-databinding.js';
import { initializeNsdoc } from './foundation/nsdoc.js';

const factor = window.process && process.env.CI ? 4 : 2;
function timeout(ms: number) {
  return new Promise(res => {
    setTimeout(res, ms * factor);
  });
}
mocha.timeout(2000 * factor);

customElements.define(
  'oscd-editor-subscriber-databinding',
  OscdEditorSubscriberDatabinding,
);

const sclXmlDocString = `<?xml version="1.0" encoding="UTF-8"?><SCL version="2007" revision="B" xmlns="http://www.iec.ch/61850/2003/SCL" xmlns:ens1="http://example.org/somePreexistingExtensionNamespace">
  <Substation ens1:foo="a" name="A1" desc="test substation"></Substation>
</SCL>`;

describe('oscd-editor-subscriber-databinding', () => {
  let plugin: OscdEditorSubscriberDatabinding;

  beforeEach(async () => {
    const sclDoc = new DOMParser().parseFromString(
      sclXmlDocString,
      'application/xml',
    );
    plugin = await fixture(
      html`<oscd-editor-subscriber-databinding></oscd-editor-subscriber-databinding>`,
    );
    plugin.doc = sclDoc;
    plugin.nsdoc = initializeNsdoc();
  });

  afterEach(() => {
    plugin.remove();
  });

  it('tests that the plugin works as expected', async () => {
    await setViewport({ width: 1200, height: 800 });

    await plugin.updateComplete;
    await timeout(400);
    const radios = plugin.shadowRoot?.querySelectorAll('oscd-radio');
    if (!radios || radios.length !== 2) {
      throw new Error('Expected two radios');
    }
    // await visualDiff(document.body, `oscd-editor-subscriber-databinding/#1 Dummy Test`);
  });
});
