import { mount } from "svelte";
import App from "./App.viand";
import "./app.css";

mount(App, {
  target: document.getElementById("app")!,
});
