/**
 * Helper functions for control block context menu actions.
 *
 * These helpers navigate the SCL document structure to find elements
 * associated with a given control block. They are used by the context menu
 * to open edit dialogs and build remove edits.
 */

import type { EditV2, Remove } from '@openscd/oscd-api';

/**
 * Returns the DataSet referenced by a control block's `datSet` attribute.
 * The DataSet must be a sibling under the same LN0.
 */
export function getAssociatedDataSet(control: Element): Element | null {
  const datSet = control.getAttribute('datSet');
  if (!datSet) {
    return null;
  }
  return (
    control
      .closest('LN0')
      ?.querySelector(`:scope > DataSet[name="${datSet}"]`) ?? null
  );
}

/**
 * Returns the communication element associated with a control block.
 * The element is located in Communication \> SubNetwork \> ConnectedAP and matched
 * by iedName, apName, ldInst, and cbName.
 */
export function getAssociatedCommunication(control: Element): Element | null {
  const iedName = control.closest('IED')?.getAttribute('name');
  const apName = control.closest('AccessPoint')?.getAttribute('name');
  const ldInst = control.closest('LDevice')?.getAttribute('inst');
  const cbName = control.getAttribute('name');
  if (!iedName || !apName || !ldInst || !cbName) {
    return null;
  }
  const communicationTag =
    control.tagName === 'GSEControl'
      ? 'GSE'
      : control.tagName === 'SampledValueControl'
        ? 'SMV'
        : null;
  if (!communicationTag) {
    return null;
  }
  const doc = control.ownerDocument;
  return doc.querySelector(
    `Communication > SubNetwork > ConnectedAP[iedName="${iedName}"][apName="${apName}"] > ${communicationTag}[ldInst="${ldInst}"][cbName="${cbName}"]`,
  );
}

/**
 * Returns the SmvOpts child element when editing a SampledValueControl.
 */
export function getAssociatedSmvOpts(control: Element): Element | null {
  if (control.tagName === 'SampledValueControl') {
    return control.querySelector(':scope > SmvOpts');
  }
  return null;
}

/**
 * Returns true if no other control block under the same LN0 references
 * the given DataSet. A single-use DataSet can be safely removed together
 * with its control block.
 */
export function isDataSetSingleUse(dataSet: Element): boolean {
  const name = dataSet.getAttribute('name');
  const ln0 = dataSet.closest('LN0');
  if (!name || !ln0) {
    return true;
  }
  const refs = ln0.querySelectorAll(`:scope > *[datSet="${name}"]`);
  return refs.length <= 1;
}

/**
 * Builds an EditV2 array that removes a control block and its associated
 * elements: the DataSet (if single-use) and its communication element.
 */
export function buildRemoveEdits(control: Element): EditV2[] {
  const edits: Remove[] = [{ node: control }];

  const dataSet = getAssociatedDataSet(control);
  if (dataSet && isDataSetSingleUse(dataSet)) {
    edits.push({ node: dataSet });
  }

  const communication = getAssociatedCommunication(control);
  if (communication) {
    edits.push({ node: communication });
  }

  return edits;
}
