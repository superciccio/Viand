import { signal, effect, computed, h, renderList, renderMatch } from "../../packages/runtime/src/ssr.ts";

export function App(__props = {}) {
  const count = signal(0);
  const add = () => {
    count.value += 1
  };

  return h("div", { "class": "fragment" }, [h("h1", {  }, ["Viand Signals Foundry"], null, { type: 'element', tag: "h1", line: 7 }), h("p", {  }, [computed(() => `The count is ${ count.value }`)], null, { type: 'element', tag: "p", line: 8 }), h("button", { "onclick": add }, ["Add One"], null, { type: 'element', tag: "button", line: 9 })], null, { type: 'fragment', line: 0 });
}
