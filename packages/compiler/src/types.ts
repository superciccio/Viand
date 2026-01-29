export type TokenType = 
    | 'COMPONENT_DECL'
    | 'IMPORT_DECLARATION'
    | 'PROP_DECLARATION'
    | 'STATE_VARIABLE'
    | 'REACTIVE_DECLARATION'
    | 'FUNCTION_ACTION'
    | 'STYLE_ROOT'
    | 'VIEW_ROOT'
    | 'CONTROL_FLOW'
    | 'UI_ELEMENT'
    | 'EXPRESSION';

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
}

export interface ManifestFunction {
    type: 'function' | 'js-block';
    name?: string;
    params?: string[];
    body: (string | ManifestFunction)[];
    depth: number;
}

export interface ManifestStyle {
    selector: string;
    rules: string[];
}

export type ViewNodeType = 'element' | 'text' | 'if' | 'each' | 'match';

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
}

export interface ComponentManifest {
    name: string;
    imports: { name: string, path: string }[];
    props: ManifestProp[];
    state: ManifestProp[];
    reactive: { id: string, expression: string }[];
    functions: ManifestFunction[];
    styles: ManifestStyle[];
    view: ViewNode[];
}
