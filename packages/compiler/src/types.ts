export type TokenType =
    | 'COMPONENT_DECL'
    | 'MEMORY_DECL'
    | 'IMPORT_DECLARATION'
    | 'PROP_DECLARATION'
    | 'STATE_VARIABLE'
    | 'REACTIVE_DECLARATION'
    | 'FUNCTION_ACTION'
    | 'LIFECYCLE_BLOCK'
    | 'WATCH_BLOCK'
    | 'STYLE_ROOT'
    | 'HEAD_ROOT'
    | 'TEST_ROOT'
    | 'TEST_PERSONA'
    | 'VIEW_ROOT'
    | 'CONTROL_FLOW'
    | 'UI_ELEMENT'
    | 'MUST_ASSERTION'
    | 'EXPRESSION';

export interface Token {
    line: number;
    indent: number;
    type: TokenType;
    content: string;
    raw: string;
    depth: number;
}

export interface ManifestStyle {
    selector: string;
    rules: string[];
    line?: number;
}

export type ManifestFunction =
    | { type: 'function'; name: string; params: string[]; body: (string | ManifestFunction)[]; depth?: number; line?: number; expression?: string; }
    | { type: 'js-block'; body: (string | ManifestFunction)[]; name?: string; params?: string[]; depth?: number; line?: number; expression?: string; }
    | { type: 'must'; body?: (string | ManifestFunction)[]; name?: string; params?: string[]; expression: string; depth?: number; line?: number; };

export type ViewNode =
    | { type: 'element'; tag: string; attrs: Record<string, string>; ref?: string; children: ViewNode[]; line?: number; }
    | { type: 'text'; content: string; children: ViewNode[]; line?: number; }
    | { type: 'fragment'; children: ViewNode[]; line?: number; }
    | { type: 'each'; list: string; item: string; children: ViewNode[]; line?: number; }
    | { type: 'match'; expression: string; cases: { condition: string; children: ViewNode[] }[]; defaultCase?: { children: ViewNode[] }; children: ViewNode[]; line?: number; }
    | { type: 'slot'; content: string; children: ViewNode[]; line?: number; }
    | { type: 'if'; condition: string; children: ViewNode[]; alternate?: ViewNode; line?: number; };

export interface TestNode {
    type: 'logic' | 'ui' | 'integration';
    body: any[];
    line: number;
    depth: number;
}

export interface ComponentManifest {
    name: string;
    isMemory: boolean;
    imports: { name: string; path: string }[];
    props: { id: string; type: string; value: string; line: number }[];
    state: { id: string; type: string; value: string; line: number }[];
    reactive: { id: string; expression: string }[];
    functions: ManifestFunction[];
    onMount: (string | ManifestFunction)[];
    watch: { dependency: string, body: (string | ManifestFunction)[] }[];
    refs: string[];
    styles: ManifestStyle[];
    view: ViewNode[];
    tests: TestNode[];
    queries: { label: string, query: string }[];
    api: {
        label: string,
        method: string,
        path: string,
        headers?: Record<string, string>,
        query?: Record<string, string>,
        params?: Record<string, string>,
        body?: string,
        mock?: string,
        logic?: string
    }[];
    sql: {
        label: string,
        method: string,
        path: string,
        query: string,
        params?: Record<string, string>
    }[];
    lang: Record<string, Record<string, string>>;
    head: {
        title?: string;
        meta?: Record<string, string>;
        og?: Record<string, string>;
        twitter?: Record<string, string>;
        link?: Array<Record<string, string>>;
        [key: string]: any; // Allow indexing for sections
    };
    slots: string[];
}