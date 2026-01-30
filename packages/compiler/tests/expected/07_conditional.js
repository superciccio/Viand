import { signal, effect, computed, h, renderList } from "./runtime";

export function Conditional(__props = {}) {
  console.log("Viand Widget Tree for Conditional:", {
  "type": "fragment",
  "children": []
});
  const count = signal(10);

  return h("div", { class: "fragment" }, []);
}
