import { signal, effect, computed, h, renderList } from "./runtime";

export function App(__props = {}) {
  const count = signal(0);
  const add = () => {
    count.value += 1;
  };

  return h("div", {}, [h("h1", {  }, ["Viand Signals Foundry"]), h("p", {  }, [computed(() => `The count is ${count.value}`)]), h("button", { onclick: add }, ["Add One"])]);
}
