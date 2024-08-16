import fs from 'fs';
import path from 'path';

interface FileStats {
    name: string;
    lines: number;
}

function countLinesInFile(filePath: string): number {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n').length;
}

function getTypeScriptFiles(dir: string): string[] {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...getTypeScriptFiles(fullPath));
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.css'))) {
            files.push(fullPath);
        }
    }

    return files;
}

function calculateLOC(projectPath: string): { total: number; perFile: FileStats[] } {
    const files = getTypeScriptFiles(projectPath);
    let totalLines = 0;
    const fileStats: FileStats[] = [];

    for (const file of files) {
        const lines = countLinesInFile(file);
        totalLines += lines;
        fileStats.push({
            name: path.relative(projectPath, file),
            lines: lines,
        });
    }

    return { total: totalLines, perFile: fileStats };
}

// Usage
const projectPath = './src'; // Adjust this to your project's source directory
const result = calculateLOC(projectPath);

console.log(`Total lines of code: ${result.total}`);
console.log('\nLines per file:');
result.perFile.forEach(file => {
    console.log(`${file.name}: ${file.lines} lines`);
});