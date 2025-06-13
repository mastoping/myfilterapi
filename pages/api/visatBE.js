import { createConnection } from 'mysql2';
import fetch from 'node-fetch';
import { exec } from 'child_process';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'voucher_isat'
};

const connection = createConnection(dbConfig);

function getVoucherData() {
  return new Promise((resolve, reject) => {
    connection.query('SELECT id, barcode, sn_gosok, created_at FROM vouchers LIMIT 1', (err, results) => {
      if (err) return reject(err);
      if (results.length === 0) return resolve(null);

      // Konversi format created_at agar sesuai dengan format di database
      const data = results[0];
      if (data.created_at) {
        const date = new Date(data.created_at);
        data.created_at = date.toISOString().replace('T', ' ').slice(0, 19); // Format YYYY-MM-DD HH:mm:ss
      }
      resolve(data);
    });
  });
}

function deleteVoucherData(id) {
  return new Promise((resolve, reject) => {
    connection.query('DELETE FROM vouchers WHERE id = ?', [id], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

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

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkVoucherStatus(username, sn, maxAttempts = 2) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(`http://localhost:48000/voucher_status?username=${username}&sn=${sn}`);
      const statusData = await response.json();

      if (statusData?.data?.voucherCategoryName) {
        return statusData;
      }

      if (attempt < maxAttempts) {
        await wait(2000); 
      }
    } catch (error) {
      console.error(`Error checking voucher status (attempt ${attempt}):`, error);
    }
  }

  return null; 
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    playSound('sounds/error.wav');
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { username, pin, tujuan, kode, productName, amount, noDelete } = req.query;

  if (!username || !pin || !tujuan || !kode || !productName || !amount) {
    playSound('sounds/error.wav');
    return res.status(400).json({ error: "Parameter 'username', 'pin', 'tujuan', 'kode', 'productName', dan 'amount' harus disertakan." });
  }

  try {
    const data = await getVoucherData();

    if (!data || !data.barcode) {
      playSound('sounds/error.wav');
      return res.status(404).json({ error: 'Tidak ada voucher yang tersedia' });
    }

    const trxid = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const encodedProductName = encodeURIComponent(productName);
    const url = `http://localhost:48000/voucher?username=${username}&pin=${pin}&to=${data.barcode}&dnmcode=${kode}&productName=${encodedProductName}&amount=${amount}&payment_method=1&idtrx=${trxid}`;

    const response = await fetch(url);
    const responseData = await response.json();

    if (response.status !== 200) {
      playSound('sounds/error.wav');
      return res.status(response.status).json({ error: `Tidak dapat mengakses API eksternal. HTTP Status Code: ${response.status}` });
    }

    const { to } = responseData;

    // Panggil API voucher_status
    const voucherStatus = await checkVoucherStatus(username, to);

    if (!voucherStatus) {
      playSound('sounds/error.wav');
      return res.status(500).json({ error: `${tujuan} Transaksi Gagal, cek PIN/Kode/Saldo` });
    }

    // Respons sukses
    playSound('sounds/pika.wav');
    res.status(200).json({
      trxid,
      tujuan,
      sn_gosok: data.sn_gosok,
      created_at: data.created_at, // Sudah dalam format YYYY-MM-DD HH:mm:ss
      response: responseData,
      voucherStatus,
      message: "Permintaan diproses dengan sukses"
    });

    if (!noDelete || noDelete !== 'true') {
      await deleteVoucherData(data.id);
    }
  } catch (err) {
    playSound('sounds/error.wav');
    console.error(err);
    res.status(500).json({ error: `nomor anda: ${tujuan}. Terjadi kesalahan pada server`, details: err.message });
  }
}
