import { signal, effect, computed, h, renderList } from "./runtime";

export function Dashboard(__props = {}) {
  console.log("Viand Widget Tree for Dashboard:", {
  "type": "element",
  "tag": "canvas",
  "props": {},
  "children": []
});

  return h("canvas", {  }, []);
}
