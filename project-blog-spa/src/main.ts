import { mount } from "@viand/runtime";
import { App } from "./App.viand";
import { router } from "./viand-router";
import "./app.css";

const target = document.getElementById("app")!;

// Enable SPA navigation
router.enableSPA();

mount(target, () => App());