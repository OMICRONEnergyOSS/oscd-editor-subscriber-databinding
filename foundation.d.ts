export type ControlTag = 'GSEControl' | 'SampledValueControl' | 'ReportControl';
export declare function getSubscribedExtRefElements(rootElement: Element, controlTag: ControlTag, fcdaElement: Element | undefined, controlElement: Element | undefined): Element[];
