/** SCL XML namespace URI. */
export const SCL_NAMESPACE = 'http://www.iec.ch/61850/2003/SCL';

export type SclEdition = '2003' | '2007B' | '2007B4';

/**
 * Derives the SCL schema edition from the root element attributes.
 */
export function getSclSchemaVersion(doc: Document): SclEdition {
  const scl: Element = doc.documentElement;
  const edition =
    (scl.getAttribute('version') ?? '2003') +
    (scl.getAttribute('revision') ?? '') +
    (scl.getAttribute('release') ?? '');
  return edition as SclEdition;
}

/**
 * Extracts the `name` attribute from an element.
 * @returns the name, or undefined if there is no name.
 */
export function getNameAttribute(element: Element): string | undefined {
  const name = element.getAttribute('name');
  return name ? name : undefined;
}

/**
 * Extracts the `desc` attribute from an element.
 * @returns the description, or undefined if there is no description.
 */
export function getDescriptionAttribute(element: Element): string | undefined {
  const name = element.getAttribute('desc');
  return name ? name : undefined;
}

/** Locale-aware comparison of elements or strings by `name` attribute. */
export function compareNames(a: Element | string, b: Element | string): number {
  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b);
  }

  if (typeof a === 'object' && typeof b === 'string') {
    return (a.getAttribute('name') ?? '').localeCompare(b);
  }

  if (typeof a === 'string' && typeof b === 'object') {
    return a.localeCompare(b.getAttribute('name')!);
  }

  if (typeof a === 'object' && typeof b === 'object') {
    return (a.getAttribute('name') ?? '').localeCompare(
      b.getAttribute('name') ?? '',
    );
  }

  return 0;
}
