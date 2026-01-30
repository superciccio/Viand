import { signal, effect, computed, h, renderList } from "./runtime";

export function ConditionalClass(__props = {}) {
  console.log("Viand Widget Tree for ConditionalClass:", {
  "type": "element",
  "tag": "div",
  "props": {
    "class:active": "isActive.value",
    "class": "\"box\""
  },
  "children": [
    {
      "type": "text",
      "value": "Status Box",
      "isReactive": false
    }
  ]
});
  const isActive = signal(true);

  return h("div", { class:active: isActive.value, class: "box" }, ["Status Box"]);
}
