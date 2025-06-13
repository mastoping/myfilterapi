import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Memainkan suara berdasarkan file yang diberikan.
 * Menggunakan perintah berbeda sesuai platform.
 */
function playSound(filePath) {
    const command =
        process.platform === 'win32'
            ? `powershell -c (New-Object Media.SoundPlayer '${filePath}').PlaySync();`
            : process.platform === 'darwin'
            ? `afplay ${filePath}`
            : `mpg123 ${filePath}`;

    exec(command, (err) => {
        if (err) {
            console.error(`Error playing sound (${filePath}):`, err);
        }
    });
}

/**
 * Menghasilkan transactionId berdasarkan waktu saat ini atau menggunakan idtrx yang diberikan.
 */
function generateTransactionId(idtrx) {
  if (idtrx) return idtrx;
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  return (
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

/**
 * Handler untuk memproses pembayaran.
 */
export default async function handler(req, res) {
  try {
    const { username, pin, to, custom_code: pid, idtrx } = req.query;

    // Validasi parameter wajib
    if (!username || !pin || !to) {
      return res.status(400).json({ error: 'Parameter username, pin, dan to diperlukan' });
    }

    if (!pid || isNaN(pid)) {
      return res.status(400).json({ error: 'Parameter PID diperlukan dan harus berupa angka' });
    }

    // 1. Ambil data produk
    const productResponse = await fetch(
      `http://localhost:17000/listCuanku?username=${encodeURIComponent(username)}&to=${encodeURIComponent(to)}&json=1`
    );
    if (!productResponse.ok) {
      return res.status(500).json({ error: 'Gagal mengambil data produk' });
    }
    const products = await productResponse.json();

    // 2. Validasi PID
    const pidNum = parseInt(pid, 10);
    if (pidNum < 1 || pidNum > products.length) {
      return res.status(400).json({ error: 'PID tidak valid' });
    }

    // 3. Proses pembayaran
    const selectedProduct = products[pidNum - 1];
    const transactionId = generateTransactionId(idtrx);

    // 4. Eksekusi pembayaran
    const paymentUrl = `http://localhost:17000/cuanku?username=${encodeURIComponent(username)}&pin=${encodeURIComponent(pin)}&to=${encodeURIComponent(to)}&custom_code=${encodeURIComponent(selectedProduct.custom_code)}&idtrx=${encodeURIComponent(transactionId)}`;
    const paymentResponse = await fetch(paymentUrl);
    if (!paymentResponse.ok) {
      return res.status(500).json({ error: 'Gagal melakukan pembayaran' });
    }
    const paymentResult = await paymentResponse.json();

    // 5. Mainkan suara (jika gagal, hanya log error)
    try {
      playSound('sounds/coc.wav');
    } catch (soundError) {
      console.error('Gagal memainkan suara:', soundError);
    }

    // Kirim hasil pembayaran ke client
    res.status(200).json(paymentResult);
  } catch (error) {
    console.error('Error dalam handler:', error);
    playSound('sounds/coc.wav');
    res.status(500).json({
      error: 'Gagal memproses pembayaran',
      detail: error.message,
    });
  }
}
