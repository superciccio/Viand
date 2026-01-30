import { signal, effect, computed, h, renderList } from "./runtime";

export function App(__props = {}) {
  console.log("Viand Widget Tree for App:", {
  "type": "element",
  "tag": "Layout",
  "props": {},
  "children": [
    {
      "type": "element",
      "tag": "h1",
      "props": {},
      "children": [
        {
          "type": "text",
          "value": "Hello from Slot",
          "isReactive": false
        }
      ]
    }
  ]
});

  return h("Layout", {  }, [h("h1", {  }, ["Hello from Slot"])]);
}
