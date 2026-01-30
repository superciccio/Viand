import { signal, effect, computed, h, renderList } from "./runtime";

export function App(__props = {}) {
  console.log("Viand Widget Tree for App:", {
  "type": "fragment",
  "children": []
});

  return h("div", { class: "fragment" }, []);
}
