import { signal, computed } from "@preact/signals-core";
import { bind, renderList } from "./runtime";

/**
 * This is what the NEW Viand Compiler will output.
 * No Svelte, No Brackets, just Pure Performance.
 */
export function App() {
  // --- BRAIN (Logic) ---
  const count = signal(0);
  const title = computed(() => `Signals Lab: ${count.value}`);
  const items = signal(["Bake", "Serve", "Verify"]);

  const increment = () => {
    count.value += 1;
    if (count.value % 5 === 0) {
      items.value = [...items.value, `New Pillar ${count.value}`];
    }
  };

  // --- FACE (View) ---
  const root = document.createElement("div");
  root.style.padding = "50px";
  root.style.fontFamily = "sans-serif";

  const h1 = document.createElement("h1");
  h1.style.color = "#3b82f6";
  bind(h1, "text", title); // Explicit binding!

  const p = document.createElement("p");
  bind(p, "text", computed(() => `Reactive Count: ${count.value}`));

  const btn = document.createElement("button");
  btn.textContent = "Executive Increment";
  btn.style.cssText = "padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; margin-bottom: 20px;";
  btn.onclick = increment;

  const ul = document.createElement("ul");
  renderList(ul, items, (item) => {
    const li = document.createElement("li");
    li.textContent = item;
    return li;
  });

  root.appendChild(h1);
  root.appendChild(p);
  root.appendChild(btn);
  root.appendChild(ul);

  return root;
}
