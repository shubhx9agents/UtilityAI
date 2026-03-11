const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function processFiles() {
    const rootDir = path.join('d:', '9agents Internship', 'UtilityAI', 'utilityai-nextjs', 'app', 'api');
    let count = 0;

    walkDir(rootDir, filePath => {
        if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;

        let content = fs.readFileSync(filePath, 'utf8');
        let needsWrite = false;

        // 1. Check if catch (error: any) exists
        if (content.includes('catch (error: any)')) {
            content = content.replace(/catch\s*\(\s*error\s*:\s*any\s*\)/g, 'catch (error: unknown)');
            needsWrite = true;
        }

        if (needsWrite) {
            // Replace error.message or error.message || '...'
            // Matches: error.message || 'Some string'
            // Matches: error.message
            content = content.replace(/error\.message(?:\s*\|\|\s*(['"`][^'"`]*['"`]))?/g, 'getErrorMessage(error)');

            // Add import if missing
            if (!content.includes('getErrorMessage')) {
                // If it doesn't include the import, we already replaced error.message with getErrorMessage
                // Wait, if it didn't have error.message but just error, we still might need the import if we used getErrorMessage?
                // Actually, if we replaced error.message with getErrorMessage, it now HAS getErrorMessage!
            }

            if (content.includes('getErrorMessage') && !content.includes('import { getErrorMessage }')) {
                // Determine import path
                // If in app/api/auth/..., the path might be @/lib/types/errors
                const importStmt = "import { getErrorMessage } from '@/lib/types/errors'\n";
                // Insert after last import or at top
                const lastImportIdx = content.lastIndexOf('import ');
                if (lastImportIdx !== -1) {
                    const nextLineIdx = content.indexOf('\n', lastImportIdx);
                    content = content.slice(0, nextLineIdx + 1) + importStmt + content.slice(nextLineIdx + 1);
                } else {
                    content = importStmt + content;
                }
            }

            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated ${filePath}`);
            count++;
        }
    });

    // Also check lib/ai/agents.ts and lib/ai/workflow-executor.ts
    const extraFiles = [
        path.join('d:', '9agents Internship', 'UtilityAI', 'utilityai-nextjs', 'lib', 'ai', 'agents.ts'),
        path.join('d:', '9agents Internship', 'UtilityAI', 'utilityai-nextjs', 'lib', 'ai', 'workflow-executor.ts')
    ]

    extraFiles.forEach(filePath => {
        if (!fs.existsSync(filePath)) return;
        let content = fs.readFileSync(filePath, 'utf8');
        let needsWrite = false;
        if (content.includes('catch (error: any)')) {
            content = content.replace(/catch\s*\(\s*error\s*:\s*any\s*\)/g, 'catch (error: unknown)');
            needsWrite = true;
        }
        if (needsWrite) {
            content = content.replace(/error\.message(?:\s*\|\|\s*(['"`][^'"`]*['"`]))?/g, 'getErrorMessage(error)');
            if (content.includes('getErrorMessage') && !content.includes('import { getErrorMessage }')) {
                const importStmt = "import { getErrorMessage } from '@/lib/types/errors'\n";
                const lastImportIdx = content.lastIndexOf('import ');
                if (lastImportIdx !== -1) {
                    const nextLineIdx = content.indexOf('\n', lastImportIdx);
                    content = content.slice(0, nextLineIdx + 1) + importStmt + content.slice(nextLineIdx + 1);
                } else {
                    content = importStmt + content;
                }
            }
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated ${filePath}`);
            count++;
        }
    });

    console.log(`Total files updated: ${count}`);
}

processFiles();
