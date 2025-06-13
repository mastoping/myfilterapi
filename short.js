const { exec } = require('child_process');

// Skrip PowerShell untuk membuat shortcut
const psScript = `
$WshShell = New-Object -ComObject WScript.Shell;
$shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\\Desktop\\Start-NextJS-Dev.lnk");
$shortcut.TargetPath = "C:\\xampp\\htdocs\\dashboard\\my-filter-api\\start-dev.bat";
$shortcut.IconLocation = "C:\\xampp\\htdocs\\dashboard\\my-filter-api\\img\\byu.ico";
$shortcut.Save();
`;

// Menjalankan skrip PowerShell dengan exec
exec(`powershell -Command "${psScript}"`, (err, stdout, stderr) => {
  if (err) {
    console.error('Error creating shortcut with PowerShell:', err);
    return;
  }
  if (stderr) {
    console.error('stderr:', stderr);
    return;
  }
  console.log('Shortcut created successfully with PowerShell!');
});
