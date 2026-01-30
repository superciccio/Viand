import { signal, effect, computed, h, renderList } from "./runtime";

export function InputTest(__props = {}) {
  console.log("Viand Widget Tree for InputTest:", {
  "type": "element",
  "tag": "input",
  "props": {
    "type": "\"text\"",
    "value": "myValue.value"
  },
  "children": []
});
  const myValue = signal("Hello");

  return h("input", { type: "text", value: myValue.value }, []);
}
