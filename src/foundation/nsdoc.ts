export interface Nsdoc {
  nsdoc72?: XMLDocument;
  nsdoc73?: XMLDocument;
  nsdoc74?: XMLDocument;
  nsdoc81?: XMLDocument;
  getDataDescription: (
    element: Element,
    ancestors?: Element[],
  ) => { label: string };
}

export function initializeNsdoc(): Nsdoc {
  return {
    getDataDescription: (e: Element) => {
      return {
        label:
          e.getAttribute('desc') ||
          e.getAttribute('lnClass') ||
          e.getAttribute('type') ||
          e.getAttribute('name') ||
          e.getAttribute('id') ||
          e.tagName,
      };
    },
  };
}
