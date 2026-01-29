export type TokenType = 
    | 'COMPONENT_DECL'
    | 'MEMORY_DECL'
    | 'IMPORT_DECLARATION'
    | 'PROP_DECLARATION'
    | 'STATE_VARIABLE'
    | 'REACTIVE_DECLARATION'
    | 'FUNCTION_ACTION'
    | 'STYLE_ROOT'
    | 'VIEW_ROOT'
    | 'TEST_ROOT'
    | 'TEST_PERSONA'
    | 'CONTROL_FLOW'
    | 'UI_ELEMENT'
    | 'EXPRESSION'
    | 'MUST_ASSERTION';

export interface Token {
    line: number;
    indent: number;
    type: TokenType;
    content: string;
    raw: string;
    depth: number;
}

export interface ManifestProp {
    id: string;
    type: string;
    value: string;
    line: number;
}

export interface ManifestFunction {
    type: 'function' | 'js-block';
    name?: string;
    params?: string[];
    body: (string | ManifestFunction)[];
    depth: number;
    line: number;
}

export interface ManifestStyle {
    selector: string;
    rules: string[];
    line: number;
}

export type ViewNodeType = 'element' | 'text' | 'if' | 'each' | 'match' | 'slot';

export interface ViewNode {
    type: ViewNodeType;
    tag?: string;
    attrs?: Record<string, string>;
    children: ViewNode[];
    content?: string;
    condition?: string;
    alternate?: ViewNode;
    list?: string;
    item?: string;
    expression?: string;
    cases?: { condition: string, children: ViewNode[] }[];
    defaultCase?: { children: ViewNode[] };
    line: number;
}

export interface TestNode {
    type: 'logic' | 'ui' | 'integration';
    body: (string | MustAssertion)[];
    line: number;
    depth: number;
}

export interface MustAssertion {
    type: 'must';
    expression: string;
    line: number;
}

export interface ComponentManifest {
    name: string;
    isMemory: boolean;
    imports: { name: string, path: string }[];
    props: ManifestProp[];
    state: ManifestProp[];
    reactive: { id: string, expression: string }[];
    functions: ManifestFunction[];
    styles: ManifestStyle[];
    view: ViewNode[];
    tests: TestNode[];
    queries: { label: string, query: string }[];
    slots: string[];
}
