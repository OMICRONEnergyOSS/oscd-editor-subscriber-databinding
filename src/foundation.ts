import { getSclSchemaVersion } from './foundation/scl.js';
import { serviceTypes } from './components/subscription.js';

/**
 * Simple function to check if the attribute of the Left Side has the same value as the attribute of the Right Element.
 *
 * @param leftElement   - The Left Element to check against.
 * @param rightElement  - The Right Element to check.
 * @param attributeName - The name of the attribute to check.
 */
function sameAttributeValue(
  leftElement: Element | undefined,
  rightElement: Element | undefined,
  attributeName: string,
): boolean {
  return (
    (leftElement?.getAttribute(attributeName) ?? '') ===
    (rightElement?.getAttribute(attributeName) ?? '')
  );
}

/**
 * Simple function to check if the attribute of the Left Side has the same value as the attribute of the Right Element.
 *
 * @param leftElement        - The Left Element to check against.
 * @param leftAttributeName  - The name of the attribute (left) to check against.
 * @param rightElement       - The Right Element to check.
 * @param rightAttributeName - The name of the attribute (right) to check.
 */
function sameAttributeValueDiffName(
  leftElement: Element | undefined,
  leftAttributeName: string,
  rightElement: Element | undefined,
  rightAttributeName: string,
): boolean {
  return (
    (leftElement?.getAttribute(leftAttributeName) ?? '') ===
    (rightElement?.getAttribute(rightAttributeName) ?? '')
  );
}

/**
 * If needed check version specific attributes against FCDA Element.
 *
 * @param controlTag     - Indicates which type of control element.
 * @param controlElement - The Control Element to check against.
 * @param extRefElement  - The Ext Ref Element to check.
 */
function checkEditionSpecificRequirements(
  controlTag: 'SampledValueControl' | 'GSEControl',
  controlElement: Element | undefined,
  extRefElement: Element,
): boolean {
  // For 2003 Edition no extra check needed.
  if (getSclSchemaVersion(extRefElement.ownerDocument) === '2003') {
    return true;
  }

  const lDeviceElement = controlElement?.closest('LDevice') ?? undefined;
  const lnElement = controlElement?.closest('LN0') ?? undefined;

  // If ExtRef is missing 'srcLNClass', it defaults to 'LLN0' as specified in the standard
  const extRefIsMissingSrcLNClass = !extRefElement.hasAttribute('srcLNClass');
  const isLnClassLLN0 = lnElement?.getAttribute('lnClass') === 'LLN0';
  const canIgnoreSrcLNClass = isLnClassLLN0 && extRefIsMissingSrcLNClass;

  // For the 2007B and 2007B4 Edition we need to check some extra attributes.
  return (
    (extRefElement.getAttribute('serviceType') ?? '') ===
      serviceTypes[controlTag] &&
    sameAttributeValueDiffName(
      extRefElement,
      'srcLDInst',
      lDeviceElement,
      'inst',
    ) &&
    sameAttributeValueDiffName(
      extRefElement,
      'srcPrefix',
      lnElement,
      'prefix',
    ) &&
    (canIgnoreSrcLNClass ||
      sameAttributeValueDiffName(
        extRefElement,
        'srcLNClass',
        lnElement,
        'lnClass',
      )) &&
    sameAttributeValueDiffName(extRefElement, 'srcLNInst', lnElement, 'inst') &&
    sameAttributeValueDiffName(
      extRefElement,
      'srcCBName',
      controlElement,
      'name',
    )
  );
}

/**
 * Check if specific attributes from the ExtRef Element are the same as the ones from the FCDA Element
 * and also if the IED Name is the same. If that is the case this ExtRef subscribes to the selected FCDA
 * Element.
 *
 * @param controlTag     - Indicates which type of control element.
 * @param controlElement - The Control Element to check against.
 * @param fcdaElement    - The FCDA Element to check against.
 * @param extRefElement  - The Ext Ref Element to check.
 */
function isSubscribedTo(
  controlTag: 'SampledValueControl' | 'GSEControl',
  controlElement: Element | undefined,
  fcdaElement: Element | undefined,
  extRefElement: Element,
): boolean {
  return (
    extRefElement.getAttribute('iedName') ===
      fcdaElement?.closest('IED')?.getAttribute('name') &&
    sameAttributeValue(fcdaElement, extRefElement, 'ldInst') &&
    sameAttributeValue(fcdaElement, extRefElement, 'prefix') &&
    sameAttributeValue(fcdaElement, extRefElement, 'lnClass') &&
    sameAttributeValue(fcdaElement, extRefElement, 'lnInst') &&
    sameAttributeValue(fcdaElement, extRefElement, 'doName') &&
    sameAttributeValue(fcdaElement, extRefElement, 'daName') &&
    checkEditionSpecificRequirements(controlTag, controlElement, extRefElement)
  );
}

function getExtRefElements(
  rootElement: Element,
  fcdaElement: Element | undefined,
): Element[] {
  return Array.from(rootElement.querySelectorAll('ExtRef'))
    .filter(element => !element.hasAttribute('intAddr'))
    .filter(element => element.closest('IED') !== fcdaElement?.closest('IED'));
}

export function getSubscribedExtRefElements(
  rootElement: Element,
  controlTag: 'SampledValueControl' | 'GSEControl',
  fcdaElement: Element | undefined,
  controlElement: Element | undefined,
): Element[] {
  return getExtRefElements(rootElement, fcdaElement).filter(extRefElement =>
    isSubscribedTo(controlTag, controlElement, fcdaElement, extRefElement),
  );
}
