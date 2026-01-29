/**
 * ComponentManifest defines the structured data representing a Viand component.
 * It is agnostic of the output target (Svelte, React, etc).
 */
export function createComponentManifest() {
    return {
        name: "",
        imports: [],   // { name, path }
        props: [],     // { id, type, value }
        state: [],     // { id, type, value }
        reactive: [],  // { id, expression }
        functions: [], // { name, params, body: [] }
        styles: [],    // { selector, rules: [] }
        view: []       // Tree of nodes: { type: 'element'|'each'|'if'|'text', ... }
    };
}

/**
 * Node types for the View Tree
 */
export const ViewNode = {
    element: (tag, attrs = {}, children = []) => ({ type: 'element', tag, attrs, children }),
    text: (content) => ({ type: 'text', content }),
    if: (condition, children = [], alternate = null) => ({ type: 'if', condition, children, alternate }),
    each: (list, item, children = []) => ({ type: 'each', list, item, children }),
    match: (expression, cases = [], defaultCase = null) => ({ type: 'match', expression, cases, defaultCase })
};
