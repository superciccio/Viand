# 🤖 The AI Sibling: LLMs as First-Class Citizens

In the era of AI, a framework shouldn't just "support" a fetch call to OpenAI—it should treat the **Prompt** as a core resource. To compete with the best, Viand will introduce the `.ai` (or `.prompt`) sibling.

## 1. The `.ai` Sibling Pattern
Instead of burying prompts in JS strings, they live in their own file.
```viand
# Home.ai
# context: UserProfile, RecentOrders
# model: gpt-4o

system:
  You are a helpful assistant for the Viand Blog.
  Use the provided context to answer questions.

human:
  What was my last order status?
```

## 2. Isomorphic AI Execution
- **The Bridge:** Calling `ai.summarize()` in `.viand` triggers a Nitro server-side route.
- **Security:** The prompt and API keys stay on the server. Only the result is sent to the Frontend signals.
- **Streaming by Default:** Signals are perfect for streaming.
  ```viand
  on click:
    $summary.value = ai.summarize($text) # Automatically handles ReadableStream -> Signal
  ```

## 3. Local/Edge Inference
- **Transformers.js:** For simple tasks (sentiment analysis, summary), the compiler can opt to run the AI sibling in the browser using Wasm.
- **Hardware Acceleration:** In Tauri apps, the AI sibling can call local LLMs (Ollama/Llama.cpp) via the `system:` block for 100% offline intelligence.

## 🏁 Summary
AI isn't a library; it's a **Sibling**. By making prompts declarative and managed by the compiler, we prevent "Prompt Spaghetti" and make LLM integration as easy as writing a SQL query.
