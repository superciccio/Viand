import { signal, effect, computed, h, renderList } from "./runtime";

export function ReactiveTest(__props = {}) {
  console.log("Viand Widget Tree for ReactiveTest:", {
  "type": "element",
  "tag": "div",
  "props": {},
  "children": [
    {
      "type": "element",
      "tag": "p",
      "props": {},
      "children": [
        {
          "type": "text",
          "value": "Count: ${ count.value }",
          "isReactive": true
        }
      ]
    },
    {
      "type": "element",
      "tag": "p",
      "props": {},
      "children": [
        {
          "type": "text",
          "value": "Double: ${ double.value }",
          "isReactive": true
        }
      ]
    },
    {
      "type": "element",
      "tag": "button",
      "props": {
        "onclick": "increment"
      },
      "children": [
        {
          "type": "text",
          "value": "Inc",
          "isReactive": false
        }
      ]
    }
  ]
});
  const count = signal(0);

  return h("div", {  }, [h("p", {  }, [computed(() => `Count: ${ count.value }`)]), h("p", {  }, [computed(() => `Double: ${ double.value }`)]), h("button", { onclick: increment }, ["Inc"])]);
}
