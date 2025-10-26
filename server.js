// server.js
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors'; // Add cors for cross-origin requests

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectsDir = path.join(__dirname, 'src', 'projects');
const app = express();

app.use(cors()); // Allow CORS for frontend-backend communication
app.use(express.json()); // Parse JSON bodies

// API to save project data
app.post('/api/projects/:projectName', async (req, res) => {
  try {
    const { projectName } = req.params;
    const projectData = req.body;

    // Path to the project file
    const filePath = path.join(projectsDir, `${projectName}.js`);

    // Format the project data as a JavaScript module
    const content = `export const project = ${JSON.stringify(projectData, null, 2)};\n`;

    // Write to the project file
    await fs.writeFile(filePath, content);

    // Regenerate src/projects/index.js
    await generateProjectsIndex();

    res.status(200).json({ message: 'Project saved successfully' });
  } catch (error) {
    console.error('Error saving project:', error);
    res.status(500).json({ error: 'Failed to save project' });
  }
});

// Function to regenerate src/projects/index.js (same as generate-projects-index.js)
async function generateProjectsIndex() {
  try {
    const files = (await fs.readdir(projectsDir)).filter(
      file => file.endsWith('.js') && file !== 'index.js'
    );

    if (files.length === 0) {
      throw new Error('No project files found in src/projects/');
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

    await fs.writeFile(path.join(projectsDir, 'index.js'), content);
    console.log('Generated src/projects/index.js');
  } catch (error) {
    console.error('Error generating projects index:', error);
    throw error;
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});