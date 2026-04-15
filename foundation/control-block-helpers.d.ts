/**
 * Helper functions for control block context menu actions.
 *
 * These helpers navigate the SCL document structure to find elements
 * associated with a given control block. They are used by the context menu
 * to open edit dialogs and build remove edits.
 */
import type { EditV2 } from '@openscd/oscd-api';
/**
 * Returns the DataSet referenced by a control block's `datSet` attribute.
 * The DataSet must be a sibling under the same LN0.
 */
export declare function getAssociatedDataSet(control: Element): Element | null;
/**
 * Returns the communication element associated with a control block.
 * The element is located in Communication \> SubNetwork \> ConnectedAP and matched
 * by iedName, apName, ldInst, and cbName.
 */
export declare function getAssociatedCommunication(control: Element): Element | null;
/**
 * Returns the SmvOpts child element when editing a SampledValueControl.
 */
export declare function getAssociatedSmvOpts(control: Element): Element | null;
/**
 * Returns true if no other control block under the same LN0 references
 * the given DataSet. A single-use DataSet can be safely removed together
 * with its control block.
 */
export declare function isDataSetSingleUse(dataSet: Element): boolean;
/**
 * Builds an EditV2 array that removes a control block and its associated
 * elements: the DataSet (if single-use) and its communication element.
 */
export declare function buildRemoveEdits(control: Element): EditV2[];
