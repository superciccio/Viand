import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function runNitroDev(projectRoot, srcDir) {
    console.log("🚀 Starting Viand Nitro Bridge via CLI...");

    const nitroSub = spawn('npx', ['nitropack', 'dev'], {
        cwd: projectRoot,
        stdio: 'inherit',
        shell: true
    });

    nitroSub.on('close', (code) => {
        console.log(`📡 Nitro Bridge closed with code ${code}`);
    });
}
