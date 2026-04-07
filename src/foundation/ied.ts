// src/foundation/ied.ts
//
// IED-related helper functions copied from the legacy monorepo.
// See recipe: replace-openscd-open-scd-foundation-with-local-helpers.md
// Step 3: Removed emptyInputsDeleteActions (now handled by scl-lib unsubscribe).

const fcdaReferences = [
  'ldInst',
  'lnClass',
  'lnInst',
  'prefix',
  'doName',
  'daName',
];

/**
 * Builds a CSS attribute selector string from FCDA reference attributes.
 */
export function getFcdaReferences(
  elementContainingFcdaReferences: Element,
): string {
  return fcdaReferences
    .map(fcdaRef =>
      elementContainingFcdaReferences.getAttribute(fcdaRef)
        ? `[${fcdaRef}="${elementContainingFcdaReferences.getAttribute(
            fcdaRef,
          )}"]`
        : '',
    )
    .join('');
}

const controlReferences = ['srcLDInst', 'srcLNClass', 'srcLNInst', 'srcCBName'];

/**
 * Builds a CSS attribute selector string from control reference attributes.
 */
export function getControlReferences(extRef: Element): string {
  return controlReferences
    .map(controlRef =>
      extRef.getAttribute(controlRef)
        ? `[${controlRef}="${extRef.getAttribute(controlRef)}"]`
        : '',
    )
    .join('');
}
