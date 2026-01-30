import { signal, effect, computed, h, renderList } from "./runtime";

export function State(__props = {}) {
  console.log("Viand Widget Tree for State:", {
  "type": "fragment",
  "children": []
});
  const theme = signal("dark");
  const toggle = () => {
    theme.value = theme.value == "dark" ? "light" : "dark";
  };

  return h("div", { class: "fragment" }, []);
}
