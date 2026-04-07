/**
 * Shared helper functions for control block context menu actions.
 *
 * These helpers navigate the SCL document structure to find elements
 * associated with a given control block (SampledValueControl). They are
 * used by the context menu to open edit dialogs and build remove edits.
 */

import type { EditV2, Remove } from '@openscd/oscd-api';

/**
 * Returns the DataSet referenced by a control block's `datSet` attribute.
 * The DataSet must be a sibling under the same LN0.
 */
export function getAssociatedDataSet(control: Element): Element | null {
  const datSet = control.getAttribute('datSet');
  if (!datSet) return null;
  return (
    control
      .closest('LN0')
      ?.querySelector(`:scope > DataSet[name="${datSet}"]`) ?? null
  );
}

/**
 * Returns the SMV communication element associated with a SampledValueControl.
 * The SMV is located in Communication > SubNetwork > ConnectedAP and matched
 * by iedName, apName, ldInst, and cbName.
 */
export function getAssociatedSMV(control: Element): Element | null {
  const iedName = control.closest('IED')?.getAttribute('name');
  const apName = control.closest('AccessPoint')?.getAttribute('name');
  const ldInst = control.closest('LDevice')?.getAttribute('inst');
  const cbName = control.getAttribute('name');
  if (!iedName || !apName || !ldInst || !cbName) return null;
  const doc = control.ownerDocument;
  return doc.querySelector(
    `Communication > SubNetwork > ConnectedAP[iedName="${iedName}"][apName="${apName}"] > SMV[ldInst="${ldInst}"][cbName="${cbName}"]`,
  );
}

/**
 * Returns the SmvOpts child element of a SampledValueControl.
 */
export function getAssociatedSmvOpts(control: Element): Element | null {
  return control.querySelector(':scope > SmvOpts');
}

/**
 * Returns true if no other control block under the same LN0 references
 * the given DataSet. A single-use DataSet can be safely removed together
 * with its control block.
 */
export function isDataSetSingleUse(dataSet: Element): boolean {
  const name = dataSet.getAttribute('name');
  const ln0 = dataSet.closest('LN0');
  if (!name || !ln0) return true;
  const refs = ln0.querySelectorAll(`:scope > *[datSet="${name}"]`);
  return refs.length <= 1;
}

/**
 * Builds an EditV2 array that removes a SampledValueControl and its
 * associated elements: the DataSet (if single-use) and the SMV
 * communication element.
 */
export function buildRemoveEdits(control: Element): EditV2[] {
  const edits: Remove[] = [{ node: control }];

  const dataSet = getAssociatedDataSet(control);
  if (dataSet && isDataSetSingleUse(dataSet)) {
    edits.push({ node: dataSet });
  }

  const smv = getAssociatedSMV(control);
  if (smv) {
    edits.push({ node: smv });
  }

  return edits;
}
