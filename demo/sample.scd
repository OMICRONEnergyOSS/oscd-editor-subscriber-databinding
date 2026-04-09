<?xml version="1.0" encoding="UTF-8"?>
<SCL xmlns="http://www.iec.ch/61850/2003/SCL"
     version="2007"
     revision="B"
     release="4">
  <Header id="goose-data-binding-demo"/>
  <Substation name="S1">
    <VoltageLevel name="V1">
      <Bay name="PUB"/>
      <Bay name="SUB"/>
    </VoltageLevel>
  </Substation>

  <Communication>
    <SubNetwork name="StationBus" type="8-MMS">
      <BitRate unit="b/s" multiplier="M">100</BitRate>

      <ConnectedAP iedName="PUB_A" apName="AP1">
        <GSE ldInst="LD_A" cbName="GCB_A">
          <Address>
            <P type="MAC-Address">01-0C-CD-01-00-01</P>
            <P type="APPID">0001</P>
          </Address>
          <MinTime unit="s" multiplier="m">10</MinTime>
          <MaxTime unit="s" multiplier="m">1000</MaxTime>
        </GSE>
      </ConnectedAP>

      <ConnectedAP iedName="PUB_B" apName="AP1">
        <GSE ldInst="LD_B" cbName="GCB_B">
          <Address>
            <P type="MAC-Address">01-0C-CD-01-00-02</P>
            <P type="APPID">0002</P>
          </Address>
          <MinTime unit="s" multiplier="m">10</MinTime>
          <MaxTime unit="s" multiplier="m">1000</MaxTime>
        </GSE>
      </ConnectedAP>

      <ConnectedAP iedName="SUB_A" apName="AP1"/>
      <ConnectedAP iedName="SUB_B" apName="AP1"/>
    </SubNetwork>
  </Communication>

  <IED name="PUB_A" manufacturer="OpenSCD">
    <AccessPoint name="AP1">
      <Server>
        <Authentication/>
        <LDevice inst="LD_A">
          <LN0 lnClass="LLN0" inst="" lnType="LLN0_Test">
            <DataSet name="DS_A">
              <FCDA ldInst="LD_A" prefix="" lnClass="TCTR" lnInst="1" doName="Beh" daName="stVal" fc="ST"/>
              <FCDA ldInst="LD_A" prefix="" lnClass="TCTR" lnInst="1" doName="Beh" daName="q" fc="ST"/>
            </DataSet>
            <GSEControl name="GCB_A" type="GOOSE" appID="0001" confRev="1" datSet="DS_A"/>
          </LN0>
          <LN lnClass="TCTR" inst="1" lnType="TCTR_Test">
            <DOI name="Beh">
              <DAI name="stVal">
                <Val>on</Val>
              </DAI>
            </DOI>
            <DOI name="HzRtg"/>
            <DOI name="ARtg"/>
          </LN>
        </LDevice>
      </Server>
    </AccessPoint>
  </IED>

  <IED name="PUB_B" manufacturer="OpenSCD">
    <AccessPoint name="AP1">
      <Server>
        <Authentication/>
        <LDevice inst="LD_B">
          <LN0 lnClass="LLN0" inst="" lnType="LLN0_Test">
            <DataSet name="DS_B">
              <FCDA ldInst="LD_B" prefix="" lnClass="TCTR" lnInst="1" doName="Beh" daName="stVal" fc="ST"/>
              <FCDA ldInst="LD_B" prefix="" lnClass="TCTR" lnInst="1" doName="Beh" daName="q" fc="ST"/>
            </DataSet>
            <GSEControl name="GCB_B" type="GOOSE" appID="0002" confRev="1" datSet="DS_B"/>
          </LN0>
          <LN lnClass="TCTR" inst="1" lnType="TCTR_Test">
            <DOI name="Beh">
              <DAI name="stVal">
                <Val>blocked</Val>
              </DAI>
            </DOI>
            <DOI name="HzRtg"/>
            <DOI name="ARtg"/>
          </LN>
        </LDevice>
      </Server>
    </AccessPoint>
  </IED>

  <IED name="SUB_A" manufacturer="OpenSCD">
    <AccessPoint name="AP1">
      <Server>
        <Authentication/>
        <LDevice inst="LD_SUB_A">
          <LN0 lnClass="LLN0" inst="" lnType="LLN0_Test">
            <Inputs>
              <ExtRef
                  iedName="PUB_A"
                  serviceType="GOOSE"
                  ldInst="LD_A"
                  prefix=""
                  lnClass="TCTR"
                  lnInst="1"
                  doName="Beh"
                  daName="stVal"
                  srcLDInst="LD_A"
                  srcLNClass="LLN0"
                  srcCBName="GCB_A"/>
              <ExtRef
                  iedName="PUB_A"
                  serviceType="GOOSE"
                  ldInst="LD_A"
                  prefix=""
                  lnClass="TCTR"
                  lnInst="1"
                  doName="Beh"
                  daName="q"
                  srcLDInst="LD_A"
                  srcLNClass="LLN0"
                  srcCBName="GCB_A"/>
            </Inputs>
          </LN0>
          <LN lnClass="TCTR" inst="1" lnType="TCTR_Test">
            <DOI name="Beh"/>
            <DOI name="HzRtg"/>
            <DOI name="ARtg"/>
            <Inputs>
              <ExtRef
                  iedName="PUB_B"
                  serviceType="GOOSE"
                  ldInst="LD_B"
                  prefix=""
                  lnClass="TCTR"
                  lnInst="1"
                  doName="Beh"
                  daName="stVal"
                  srcLDInst="LD_B"
                  srcLNClass="LLN0"
                  srcCBName="GCB_B"/>
            </Inputs>
          </LN>
        </LDevice>
      </Server>
    </AccessPoint>
  </IED>

  <IED name="SUB_B" manufacturer="OpenSCD">
    <AccessPoint name="AP1">
      <Server>
        <Authentication/>
        <LDevice inst="LD_SUB_B">
          <LN0 lnClass="LLN0" inst="" lnType="LLN0_Test">
            <Inputs>
              <ExtRef
                  iedName="PUB_B"
                  serviceType="GOOSE"
                  ldInst="LD_B"
                  prefix=""
                  lnClass="TCTR"
                  lnInst="1"
                  doName="Beh"
                  daName="q"
                  srcLDInst="LD_B"
                  srcLNClass="LLN0"
                  srcCBName="GCB_B"/>
            </Inputs>
          </LN0>
          <LN lnClass="TCTR" inst="1" lnType="TCTR_Test">
            <DOI name="Beh"/>
            <DOI name="HzRtg"/>
            <DOI name="ARtg"/>
            <Inputs>
              <ExtRef
                  iedName="PUB_A"
                  serviceType="GOOSE"
                  ldInst="LD_A"
                  prefix=""
                  lnClass="TCTR"
                  lnInst="1"
                  doName="Beh"
                  daName="stVal"
                  srcLDInst="LD_A"
                  srcLNClass="LLN0"
                  srcCBName="GCB_A"/>
            </Inputs>
          </LN>
        </LDevice>
      </Server>
    </AccessPoint>
  </IED>

  <DataTypeTemplates>
    <LNodeType lnClass="LLN0" id="LLN0_Test">
      <DO name="Beh" type="Beh_Test"/>
    </LNodeType>

    <LNodeType lnClass="TCTR" id="TCTR_Test">
      <DO name="Beh" type="Beh_Test"/>
      <DO name="HzRtg" type="HzRtg_Test"/>
      <DO name="ARtg" type="ARtg_Test"/>
    </LNodeType>

    <DOType cdc="ENS" id="Beh_Test">
      <DA name="stVal" fc="ST" dchg="true" dupd="true" bType="Enum" type="stVal_enums"/>
      <DA name="q" fc="ST" qchg="true" bType="Quality"/>
      <DA name="t" fc="ST" bType="Timestamp"/>
    </DOType>

    <DOType cdc="ASG" id="ARtg_Test">
      <DA name="setVal" fc="SG" bType="INT32"/>
      <DA name="setMag" fc="SE" bType="INT32"/>
    </DOType>

    <DOType cdc="ASG" id="HzRtg_Test">
      <DA name="setMag" fc="SE" bType="Struct" type="AnalogueValueCtl"/>
      <DA name="units" fc="CF" bType="Struct" type="Unit"/>
    </DOType>

    <DAType id="AnalogueValueCtl">
      <BDA name="i" bType="INT32"/>
    </DAType>

    <DAType id="Unit">
      <BDA name="SIUnit" bType="Enum" type="SIUnitKind"/>
      <BDA name="multiplier" bType="Enum" type="MultiplierKind"/>
    </DAType>

    <EnumType id="stVal_enums">
      <EnumVal ord="1">on</EnumVal>
      <EnumVal ord="2">blocked</EnumVal>
      <EnumVal ord="3">test</EnumVal>
      <EnumVal ord="4">test/blocked</EnumVal>
      <EnumVal ord="5">off</EnumVal>
    </EnumType>

    <EnumType id="SIUnitKind">
      <EnumVal ord="1">Hz</EnumVal>
    </EnumType>

    <EnumType id="MultiplierKind">
      <EnumVal ord="0">none</EnumVal>
    </EnumType>
  </DataTypeTemplates>
</SCL>
