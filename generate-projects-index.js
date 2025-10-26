const fs = require('fs');
const path = require('path');

const projectsDir = path.join(__dirname, 'src', 'projects');
const outputFile = path.join(projectsDir, 'index.js');

// Ensure projects directory exists
if (!fs.existsSync(projectsDir)) {
  console.error('Error: src/projects/ directory does not exist');
  process.exit(1);
}

const files = fs.readdirSync(projectsDir).filter(file => file.endsWith('.js') && file !== 'index.js');

if (files.length === 0) {
  console.error('Error: No project files found in src/projects/');
  process.exit(1);
}

const requires = files.map((file, index) => {
  const fileName = file.replace('.js', '');
  return `const { project: project${index} } = require('./${fileName}');`;
}).join('\n');

const projectExports = files.map((file, index) => {
  const fileName = file.replace('.js', '');
  return `{ ...project${index}, name: '${fileName}' }`;
}).join(',\n  ');

const content = `${requires}

module.exports = {
  projects: [
    ${projectExports}
  ]
};
`;

fs.writeFileSync(outputFile, content);
console.log('Generated src/projects/index.js');