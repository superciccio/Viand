import {
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	TextDocumentSyncKind,
	InitializeResult,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { tokenize, analyzeHierarchy, buildManifest, format } from '../../compiler/src/index.ts';

// ... (connection setup)

connection.onInitialize((params: InitializeParams) => {
	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			documentFormattingProvider: true,
			hoverProvider: true,
			completionProvider: {
				resolveProvider: true
			}
		}
	};
	return result;
});

connection.onDocumentFormatting(params => {
	const doc = documents.get(params.textDocument.uri);
	if (!doc) return null;

	const text = doc.getText();
	const formatted = format(text);

	return [
		{
			range: {
				start: { line: 0, character: 0 },
				end: { line: doc.lineCount, character: 0 }
			},
			newText: formatted
		}
	];
});

connection.onHover(params => {
	const doc = documents.get(params.textDocument.uri);
	if (!doc) return null;

	const lineText = doc.getText({
		start: { line: params.position.line, character: 0 },
		end: { line: params.position.line, character: Number.MAX_VALUE }
	});

    // Detect word at position
    const offset = params.position.character;
    const leftMatch = lineText.slice(0, offset).match(/[a-zA-Z0-9_$]+$/);
    const rightMatch = lineText.slice(offset).match(/^[a-zA-Z0-9_$]+/);
    const word = (leftMatch ? leftMatch[0] : '') + (rightMatch ? rightMatch[0] : '');

	if (word === 'router') {
		return {
			contents: {
				kind: 'markdown',
				value: '🛣️ **Viand Router**\nStandard library for isomorphic navigation.\n\nUsage: `router.path`'
			}
		};
	}
    if (word === 'sync') {
		return {
			contents: {
				kind: 'markdown',
				value: '🔄 **Sync Keyword**\nSynchronizes a reactive variable with an asynchronous source (like an API call).'
			}
		};
	}
    if (word === 'component') {
		return {
			contents: {
				kind: 'markdown',
				value: '🧱 **Viand Component**\nDefines a new UI building block with shared logic and view.'
			}
		};
	}
    if (word === 'memory') {
		return {
			contents: {
				kind: 'markdown',
				value: '🧠 **Viand Memory**\nDefines a shared, reactive global state singleton.'
			}
		};
	}
    if (word === 'mount') {
		return {
			contents: {
				kind: 'markdown',
				value: '🏗️ **On Mount**\nRuns once when the component is first added to the DOM. Use this for initializing third-party libraries (like Charts) or adding global event listeners.'
			}
		};
	}
    if (word === 'change') {
		return {
			contents: {
				kind: 'markdown',
				value: '🔄 **On Change**\nA reactive watcher. Runs whenever the specified dependency (variable or ref) changes. Replaces traditional "effects" with a declarative, safe alternative.'
			}
		};
	}

	return null;
});

// Intellisense: Completion Provider
connection.onCompletion((_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
	return [
		{
			label: 'component',
			kind: CompletionItemKind.Keyword,
			detail: 'Define a component'
		},
		{
			label: 'view:',
			kind: CompletionItemKind.Keyword,
			detail: 'Start view block'
		},
		{
			label: 'sync',
			kind: CompletionItemKind.Keyword,
			detail: 'Synchronize reactive state'
		},
		{
			label: 'fn',
			kind: CompletionItemKind.Keyword,
			detail: 'Define a function'
		},
		{
			label: 'on mount:',
			kind: CompletionItemKind.Keyword,
			detail: 'Component lifecycle'
		},
		{
			label: 'on change',
			kind: CompletionItemKind.Keyword,
			detail: 'Reactive watcher'
		},
		{
			label: 'use router',
			kind: CompletionItemKind.Keyword,
			detail: 'Import global router'
		}
	];
});

connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
	if (item.label === 'sync') {
		item.documentation = 'Automatically fetches and updates state from an async source.';
	} else if (item.label === 'on change') {
		item.documentation = 'Executes a block of code whenever a reactive variable changes.';
	}
	return item;
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	const text = textDocument.getText();
	const diagnostics: Diagnostic[] = [];

    try {
        const { tokens, lexerErrors } = tokenize(text);
        
        // 1. Report Lexer Errors (e.g. Indentation)
        lexerErrors.forEach(err => {
            const lineMatch = err.match(/Line (\d+):/);
            const line = lineMatch ? parseInt(lineMatch[1]) - 1 : 0;
            diagnostics.push({
                severity: DiagnosticSeverity.Error,
                range: {
                    start: { line, character: 0 },
                    end: { line, character: Number.MAX_VALUE }
                },
                message: err,
                source: 'viand'
            });
        });

        // 2. Future: Semantic Validation
        const tree = analyzeHierarchy(tokens);
        // buildManifest(tree, []); 

    } catch (e: any) {
        // Fallback for compiler crashes
    }

	// Send the computed diagnostics to VS Code.
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

// Listen on the connection
documents.listen(connection);
connection.listen();
