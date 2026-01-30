import { signal, effect, computed, h, renderList } from "./runtime";

export function TodoList(__props = {}) {
  console.log("Viand Widget Tree for TodoList:", {
  "type": "element",
  "tag": "ul",
  "props": {},
  "children": []
});
  const todos = signal([]);

  return h("ul", {  }, []);
}
