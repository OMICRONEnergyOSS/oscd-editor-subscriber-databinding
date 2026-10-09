import { expect } from '@open-wc/testing';
import { isInsert } from '@openscd/oscd-api/utils.js';

import { subscribeFcdaToLn } from './subscription.js';

const sclXml = `<?xml version="1.0" encoding="UTF-8"?>
<SCL version="2007" revision="B" xmlns="http://www.iec.ch/61850/2003/SCL">
  <IED name="Publisher">
    <AccessPoint name="AP">
      <Server>
        <LDevice inst="LD0">
          <LN0 lnClass="LLN0" inst="" lnType="LN0">
            <DataSet name="dataset">
              <FCDA ldInst="LD0" lnClass="MMXU" lnInst="1" doName="PhV" daName="phsA.cVal.mag.f" fc="MX" />
              <FCDA ldInst="LD0" lnClass="MMXU" lnInst="1" doName="A" daName="phsA.cVal.mag.f" fc="MX" />
            </DataSet>
            <GSEControl name="gcb" datSet="dataset" />
          </LN0>
        </LDevice>
      </Server>
    </AccessPoint>
  </IED>
  <IED name="Subscriber">
    <AccessPoint name="AP">
      <Server>
        <LDevice inst="LD0">
          <LN0 lnClass="LLN0" inst="" lnType="LN0">SUBSCRIBER_INPUTS_LN0</LN0>
          <LN prefix="" lnClass="MMXU" inst="1" lnType="MMXU">SUBSCRIBER_INPUTS_LN</LN>
        </LDevice>
      </Server>
    </AccessPoint>
  </IED>
</SCL>`;

function createDocument(
  inputs: string,
  inputParent: 'LN0' | 'LN' = 'LN0',
): XMLDocument {
  return new DOMParser().parseFromString(
    sclXml
      .replace('SUBSCRIBER_INPUTS_LN0', inputParent === 'LN0' ? inputs : '')
      .replace('SUBSCRIBER_INPUTS_LN', inputParent === 'LN' ? inputs : ''),
    'application/xml',
  );
}

function getElements(doc: XMLDocument): {
  controlBlock: Element;
  firstFcda: Element;
  secondFcda: Element;
  subscriberLn0: Element;
  subscriberLn: Element;
} {
  const controlBlock = doc.querySelector('GSEControl[name="gcb"]');
  const fcdas = doc.querySelectorAll('DataSet[name="dataset"] > FCDA');
  const subscriberLn0 = doc.querySelector(
    'IED[name="Subscriber"] > AccessPoint > Server > LDevice > LN0',
  );
  const subscriberLn = doc.querySelector(
    'IED[name="Subscriber"] > AccessPoint > Server > LDevice > LN',
  );

  if (
    !controlBlock ||
    fcdas.length !== 2 ||
    !subscriberLn0 ||
    !subscriberLn
  ) {
    throw new Error('Test SCL fixture is incomplete');
  }

  return {
    controlBlock,
    firstFcda: fcdas[0],
    secondFcda: fcdas[1],
    subscriberLn0,
    subscriberLn,
  };
}

describe('subscribeFcdaToLn', () => {
  it('creates Inputs and ExtRef together for a new binding', () => {
    const doc = createDocument('');
    const { controlBlock, firstFcda, subscriberLn0 } = getElements(doc);

    const inserts = subscribeFcdaToLn(
      subscriberLn0,
      firstFcda,
      controlBlock,
    ).filter(isInsert);
    const inputsInsert = inserts.find(edit => edit.node.nodeName === 'Inputs');
    const extRefInsert = inserts.find(edit => edit.node.nodeName === 'ExtRef');

    expect(inputsInsert).to.exist;
    expect(extRefInsert).to.exist;
    expect(extRefInsert?.parent).to.equal(inputsInsert?.node);
  });

  it('adds a new ExtRef to existing Inputs without inserting another Inputs', () => {
    const existingExtRef = `<Inputs>
      <ExtRef iedName="Publisher" ldInst="LD0" lnClass="MMXU" lnInst="1" doName="PhV" daName="phsA.cVal.mag.f" serviceType="GOOSE" srcLDInst="LD0" srcLNClass="LLN0" srcCBName="gcb" />
    </Inputs>`;
    const doc = createDocument(existingExtRef, 'LN');
    const { controlBlock, secondFcda, subscriberLn } = getElements(doc);
    const inputs = subscriberLn.querySelector(':scope > Inputs');

    if (!inputs) {
      throw new Error('Existing Inputs element is missing');
    }

    const inserts = subscribeFcdaToLn(subscriberLn, secondFcda, controlBlock)
      .filter(isInsert);

    expect(inserts).to.have.length(1);
    expect(inserts[0].node.nodeName).to.equal('ExtRef');
    expect(inserts[0].parent).to.equal(inputs);
  });

  it('does not add a duplicate ExtRef for an existing binding', () => {
    const existingExtRef = `<Inputs>
      <ExtRef iedName="Publisher" ldInst="LD0" lnClass="MMXU" lnInst="1" doName="PhV" daName="phsA.cVal.mag.f" serviceType="GOOSE" srcLDInst="LD0" srcLNClass="LLN0" srcCBName="gcb" />
    </Inputs>`;
    const doc = createDocument(existingExtRef, 'LN');
    const { controlBlock, firstFcda, subscriberLn } = getElements(doc);

    expect(subscribeFcdaToLn(subscriberLn, firstFcda, controlBlock)).to.be
      .empty;
  });
});
