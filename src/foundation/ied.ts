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
