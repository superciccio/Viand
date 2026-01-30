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
...
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
        body?: string,
        mock?: string
    }[];
    slots: string[];
}