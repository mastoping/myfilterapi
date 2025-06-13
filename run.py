import subprocess
import webbrowser

# Menjalankan perintah npm run dev
subprocess.Popen(['npm', 'run', 'dev'], cwd='./path-to-your-nextjs-project')

# Setelah server berjalan, buka browser
webbrowser.open('http://localhost:3000')
