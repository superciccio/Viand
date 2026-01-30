import { signal, effect, computed, h, renderList } from "./runtime";

export function Counter(__props = {}) {
  console.log("Viand Widget Tree for Counter:", {
  "type": "fragment",
  "children": []
});
  const count = signal(0);
  const count = signal(1);

  return h("div", { class: "fragment" }, []);
}
