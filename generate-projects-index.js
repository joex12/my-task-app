import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectsDir = path.join(__dirname, 'src', 'projects');
const outputFile = path.join(projectsDir, 'index.js');

async function generateProjectsIndex() {
  try {
    // Ensure projects directory exists
    if (!(await fs.access(projectsDir).then(() => true).catch(() => false))) {
      console.error('Error: src/projects/ directory does not exist');
      process.exit(1);
    }

    const files = (await fs.readdir(projectsDir)).filter(
      file => file.endsWith('.js') && file !== 'index.js'
    );

    if (files.length === 0) {
      console.error('Error: No project files found in src/projects/');
      process.exit(1);
    }

    const imports = files
      .map((file, index) => {
        const fileName = file.replace('.js', '');
        return `import { project as project${index} } from './${fileName}';`;
      })
      .join('\n');

    const projectExports = files
      .map((file, index) => {
        const fileName = file.replace('.js', '');
        return `{ ...project${index}, name: '${fileName}' }`;
      })
      .join(',\n  ');

    const content = `
${imports}

const projects = [
  ${projectExports}
];
export default { projects };
    `;

    await fs.writeFile(outputFile, content);
    console.log('Generated src/projects/index.js');
  } catch (error) {
    console.error('Error generating projects index:', error);
    process.exit(1);
  }
}

generateProjectsIndex();