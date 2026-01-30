import { signal, effect, computed, h, renderList } from "./runtime";

export function BindingTest(__props = {}) {
  console.log("Viand Widget Tree for BindingTest:", {
  "type": "element",
  "tag": "form",
  "props": {
    "onsubmit|preventDefault": "handleSubmit(...args)"
  },
  "children": [
    {
      "type": "element",
      "tag": "input",
      "props": {
        "bind:value": "text.value",
        "placeholder": "\"Type here\""
      },
      "children": []
    },
    {
      "type": "element",
      "tag": "button",
      "props": {},
      "children": [
        {
          "type": "text",
          "value": "Submit",
          "isReactive": false
        }
      ]
    },
    {
      "type": "element",
      "tag": "button",
      "props": {
        "onclick": "handleSubmit(...args)"
      },
      "children": [
        {
          "type": "text",
          "value": "Explicit Click",
          "isReactive": false
        }
      ]
    },
    {
      "type": "element",
      "tag": "button",
      "props": {
        "onclick": "handleSubmit"
      },
      "children": [
        {
          "type": "text",
          "value": "Shorthand Click",
          "isReactive": false
        }
      ]
    }
  ]
});
  const text = signal("");
  const handleSubmit = () => {
    text.value = "Submitted";
  };

  return h("form", { onsubmit|preventDefault: handleSubmit(...args) }, [h("input", { bind:value: text.value, placeholder: "Type here" }, []), h("button", {  }, ["Submit"]), h("button", { onclick: handleSubmit(...args) }, ["Explicit Click"]), h("button", { onclick: handleSubmit }, ["Shorthand Click"])]);
}
