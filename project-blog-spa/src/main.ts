import { mount } from "@viand/runtime";
import { App } from "./App.viand";
import { router } from "./viand-router";
import { createWebSQLDriver } from "./sql-indexeddb";
import "./app.css";

const target = document.getElementById("app")!;

// Enable SPA navigation
router.enableSPA();

// Configure the Sibling Bridge with REAL persistence
if ((window as any).viand) {
    (window as any).viand.use({
        sql: createWebSQLDriver("viand_blog_db")
    });
}

mount(target, () => App());