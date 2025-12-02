import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_FILE = path.join(__dirname, 'auth_config.js');

if (process.env.SERVER_AUTH_CONFIG) {
    try {
        // The env var should contain the JSON object content
        // e.g. {"requireAuth":true,"maxRetries":3,...}
        const configData = JSON.parse(process.env.SERVER_AUTH_CONFIG);

        const fileContent = `export const SYSTEM_CONFIG = ${JSON.stringify(configData, null, 2)};`;

        fs.writeFileSync(CONFIG_FILE, fileContent);
        console.log('✅ auth_config.js generated successfully from environment variable.');
    } catch (error) {
        console.error('❌ Error generating auth_config.js:', error.message);
        process.exit(1);
    }
} else {
    console.log('ℹ️ SERVER_AUTH_CONFIG not found. Skipping config generation.');

    // Check if file exists
    if (!fs.existsSync(CONFIG_FILE)) {
        console.warn('⚠️ auth_config.js is missing. The server will likely fail to start.');
    }
}
