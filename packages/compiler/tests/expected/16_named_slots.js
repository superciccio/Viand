import { signal, effect, computed, h, renderList } from "./runtime";

export function Split(__props = {}) {
  console.log("Viand Widget Tree for Split:", {
  "type": "fragment",
  "children": [
    {
      "type": "element",
      "tag": "div",
      "props": {
        "class": "\"left\""
      },
      "children": []
    },
    {
      "type": "element",
      "tag": "div",
      "props": {
        "class": "\"right\""
      },
      "children": []
    }
  ]
});

  return h("div", { class: "fragment" }, [h("div", { class: "left" }, []), h("div", { class: "right" }, [])]);
}
