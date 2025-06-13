const { spawn } = require('child_process');
const path = require('path');

// Tentukan path ke npm atau cmd
const cmdPath = 'npm'; // menggunakan npm saja, karena npm sudah ada di PATH

const child = spawn(cmdPath, ['run', 'dev'], { cwd: path.join(__dirname, 'C:/xampp/htdocs/dashboard/my-filter-api') });

child.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

child.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

child.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});
