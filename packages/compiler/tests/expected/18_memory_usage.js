import { signal, effect, computed, h, renderList } from "./runtime";

export function ThemeToggle(__props = {}) {
  console.log("Viand Widget Tree for ThemeToggle:", {
  "type": "element",
  "tag": "button",
  "props": {
    "onclick": "State.toggle"
  },
  "children": [
    {
      "type": "text",
      "value": "State.theme",
      "isReactive": false
    }
  ]
});

  return h("button", { onclick: State.toggle }, ["State.theme"]);
}
