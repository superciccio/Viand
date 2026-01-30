import { signal, effect, computed, h, renderList } from "./runtime";

export function StyledBtn(__props = {}) {
  console.log("Viand Widget Tree for StyledBtn:", {
  "type": "element",
  "tag": "button",
  "props": {
    "class": "\"btn\""
  },
  "children": [
    {
      "type": "text",
      "value": "Click",
      "isReactive": false
    }
  ]
});

  return h("button", { class: "btn" }, ["Click"]);
}
