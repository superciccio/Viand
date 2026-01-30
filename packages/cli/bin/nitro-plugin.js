import { defineNitroPlugin } from 'nitropack/runtime';
import { eventHandler } from 'h3';
import path from 'path';
import fs from 'fs';

export default defineNitroPlugin((nitroApp) => {
    console.log("🌊 Viand Sibling Plugin Active");

    // Note: nitroApp here is the H3 app instance in runtime
    nitroApp.h3App.use('/api/:name', eventHandler(async (event) => {
        // ...
    }));
});
