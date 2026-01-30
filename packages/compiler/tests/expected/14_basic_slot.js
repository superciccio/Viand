import { signal, effect, computed, h, renderList } from "./runtime";

export function Layout(__props = {}) {
  console.log("Viand Widget Tree for Layout:", {
  "type": "element",
  "tag": "div",
  "props": {
    "class": "\"shell\""
  },
  "children": []
});

  return h("div", { class: "shell" }, []);
}
