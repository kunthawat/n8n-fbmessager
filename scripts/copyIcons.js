const fs = require('fs');
const path = require('path');

// Create the dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
}

// Create the nodes directory if it doesn't exist
if (!fs.existsSync('dist/nodes')) {
    fs.mkdirSync('dist/nodes');
}

// Function to copy directory
const copyDirectory = (src, dest) => {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest);
    }

    const files = fs.readdirSync(src);
    for (const file of files) {
        const srcPath = path.join(src, file);
        const destPath = path.join(dest, file);

        if (fs.statSync(srcPath).isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else if (file === 'facebook.svg') {
            fs.copyFileSync(srcPath, destPath);
        }
    }
};

// Copy icons from each node directory
const nodesDir = path.join(__dirname, '..', 'nodes');
const distNodesDir = path.join(__dirname, '..', 'dist', 'nodes');

fs.readdirSync(nodesDir).forEach(nodeDir => {
    const srcDir = path.join(nodesDir, nodeDir);
    const destDir = path.join(distNodesDir, nodeDir);
    
    if (fs.statSync(srcDir).isDirectory()) {
        copyDirectory(srcDir, destDir);
    }
});

console.log('Icons copied successfully!');
