import mysql from "mysql2/promise";
import { exec } from 'child_process';

export default async function handler(req, res) {
  // Konfigurasi koneksi database
  const dbConfig = {
    host: "localhost",
    user: "root",
    password: "",
    database: "voucher_db",
  };

function playSound(filePath) {
    // Jalankan pemutar media sesuai dengan sistem operasi
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

  // Cek metode HTTP
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Hanya metode GET yang diizinkan" });
  }

  // Cek parameter query
  const { kode, tujuan, harga } = req.query;
  if (!kode || !tujuan) {
    return res.status(400).json({
      error: "Parameter 'kode' dan 'tujuan' harus disertakan",
    });
  }

  let connection;
  try {
    // Koneksi ke database
    connection = await mysql.createConnection(dbConfig);

    // Query untuk mengambil data voucher
    const [rows] = await connection.execute(
      "SELECT id, barcode, sn_gosok, created_at FROM vouchers LIMIT 1"
    );

    if (rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Tidak ada voucher yang tersedia",
      });
    }

    // Ambil data voucher pertama
    const voucher = rows[0];

    // Buat trxid berdasarkan waktu saat ini
    const trxid = new Date().toISOString().replace(/[-:.TZ]/g, "");

    // URL untuk permintaan ke API eksternal
    const url = `http://localhost:21000/spv_blank?username=08982374098&pin=1122&to=${voucher.barcode}&code=${kode}&price=${harga || ""}&idtrx=${trxid}`;

    // Kirim permintaan ke API eksternal
    const externalResponse = await fetch(url);
    const externalData = await externalResponse.text();

    // Hapus data voucher setelah digunakan
    await connection.execute("DELETE FROM vouchers WHERE id = ?", [voucher.id]);

    // Kirim respons JSON ke user
    res.status(200).json({
      status: "success",
      kode,
      harga,
      nomor_tujuan: tujuan,
      sn_gosok: voucher.sn_gosok,
      created_at: voucher.created_at,
      external_response: externalData,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  } finally {
    // Pastikan koneksi ditutup
    if (connection) {
      await connection.end();
    }
  }
}
