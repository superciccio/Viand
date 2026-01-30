import {
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	TextDocumentSyncKind,
	InitializeResult
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

	const line = doc.getText({
		start: { line: params.position.line, character: 0 },
		end: { line: params.position.line, character: Number.MAX_VALUE }
	}).trim();

	if (line.startsWith('use router')) {
		return {
			contents: {
				kind: 'markdown',
				value: '🛣️ **Viand Router**\nStandard library for isomorphic navigation.\n\nUsage: `router.path`'
			}
		};
	}
    if (line.startsWith('sync ')) {
		return {
			contents: {
				kind: 'markdown',
				value: '🔄 **Sync Keyword**\nSynchronizes a reactive variable with an asynchronous source (like an API call).'
			}
		};
	}
    if (line.startsWith('component ')) {
		return {
			contents: {
				kind: 'markdown',
				value: '🧱 **Viand Component**\nDefines a new UI building block with shared logic and view.'
			}
		};
	}

	return null;
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
