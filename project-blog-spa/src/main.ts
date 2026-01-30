import { mount } from "@viand/runtime";
import { App } from "./App.viand";
import "./app.css";

const target = document.getElementById("app")!;
mount(target, () => App());