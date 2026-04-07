import { expect, fixture, html } from '@open-wc/testing';
import OscdEditorSubscriberDatabinding from './oscd-editor-subscriber-databinding.js';
import { initializeNsdoc } from './foundation/nsdoc.js';

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
    // Add your assertions here
    expect(plugin.doc).to.exist;
  });
});
