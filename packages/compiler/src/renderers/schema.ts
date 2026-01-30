/**
 * 🧱 Viand Output Schema (The Instruction Tree)
 * Pure TypeScript interfaces for the Intermediate Representation.
 */

export interface SignalSchema {
    id: string;
    value: string;
    isDerived?: boolean;
}

export interface ActionSchema {
    name: string;
    params: string[];
    body: string[];
}

export type ViandWidget = 
    | { type: 'element'; tag: string; isComponent?: boolean; ref?: string; props: Record<string, string>; children: ViandWidget[] }
    | { type: 'text'; value: string; isReactive: boolean; isExpression?: boolean }
    | { type: 'fragment'; children: ViandWidget[] }
    | { type: 'each'; list: string; item: string; children: ViandWidget[] }
    | { type: 'match'; expression: string; cases: { condition: string; children: ViandWidget[] }[]; defaultCase?: ViandWidget[] }
    | { type: 'slot'; name: string };

export interface ComponentOutput {
    name: string;
    imports: { name: string; path: string }[];
    props: { id: string; value: string }[];
    css?: string;
    lang?: Record<string, Record<string, string>>;
    refs: string[];
    onMount: string[];
    watchers: { dependency: string; body: string[] }[];
    signals: SignalSchema[];
    actions: ActionSchema[];
    view: ViandWidget;
}

/**
 * 🛡️ Manual Integrity Check
 */
export function validateOutput(output: ComponentOutput): string[] {
    const errors: string[] = [];
    if (!output.name) errors.push("Component name is missing.");
    if (!output.view) errors.push("Component view is missing.");
    return errors;
}
