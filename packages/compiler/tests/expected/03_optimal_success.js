import { signal, effect, computed, h, renderList } from "./runtime";

export function App(__props = {}) {
  console.log("Viand Widget Tree for App:", {
  "type": "element",
  "tag": "div",
  "props": {
    "class": "\"container\""
  },
  "children": [
    {
      "type": "element",
      "tag": "h1",
      "props": {},
      "children": [
        {
          "type": "text",
          "value": "Welcome ${ user.value }",
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
          "value": "The count is ${ count.value }",
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
          "value": "Add 1",
          "isReactive": false
        }
      ]
    }
  ]
});
  const count = signal(0);
  const user = signal("Andrea");
  const increment = () => {
    count.value += 1;
  };

  return h("div", { class: "container" }, [h("h1", {  }, [computed(() => `Welcome ${ user.value }`)]), h("p", {  }, [computed(() => `The count is ${ count.value }`)]), h("button", { onclick: increment }, ["Add 1"])]);
}
