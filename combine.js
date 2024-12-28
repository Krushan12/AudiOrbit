const fs = require('fs');
const path = require('path');

// Function to read all .jsx files from a directory (including subdirectories)
const getJSXFiles = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);

    if (stat && stat.isDirectory()) {
      // Recursively call the function for subdirectories
      results = results.concat(getJSXFiles(file));
    } else if (file.endsWith('.jsx')) {
      results.push(file);
    }
  });

  return results;
};

// Function to combine all .jsx files into a single file with comments
const combineJSXFiles = (srcDir, outputFile) => {
  const jsxFiles = getJSXFiles(srcDir);
  let combinedCode = '';

  jsxFiles.forEach((filePath) => {
    const fileName = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(srcDir, filePath);
    
    // Add comment with the file's path
    combinedCode += `\n// =====================\n// ${relativePath}\n// =====================\n`;
    combinedCode += fileContent + '\n\n';
  });

  // Ensure the output directory exists
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write the combined content to the output file
  fs.writeFileSync(outputFile, combinedCode);
  console.log(`Combined file has been saved to ${outputFile}`);
};

// Usage
const sourceDirectory = path.join('C:', 'Cohort_2', 'Spotify_inter', 'my-app'); // Full path to your project
const outputFile = path.join(sourceDirectory, 'app', 'combined.jsx'); // Updated output file path

combineJSXFiles(sourceDirectory, outputFile);
