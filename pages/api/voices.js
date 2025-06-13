import { exec } from 'child_process';

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

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        playSound('sounds/error.wav'); // Putar suara untuk metode HTTP tidak diizinkan
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    const { username, payment_method, to, productSubCategory } = req.query;

    // Validasi parameter yang diperlukan
    if (!username || !payment_method || !to || !productSubCategory) {
        playSound('sounds/error.wav'); // Putar suara untuk parameter tidak valid
        return res.status(400).json({ error: "Missing required query parameters" });
    }

    try {
        // Fetch data dari API utama
        const response = await fetch(
            `http://localhost:20018/listVoiceSMS?username=${username}&payment_method=${payment_method}&to=${to}&productSubCategory=${productSubCategory}&json=1`
        );
        const data = await response.json();

        // Validasi data dari API
        if (!data.res || !Array.isArray(data.res)) {
            playSound('sounds/error.wav'); // Putar suara untuk kegagalan data
            return res.status(500).json({ error: `${to} Gagal! Nomor Pelanggan Tidak Tersedia Paket Tersebut` });
        }

        // Format hasil
        const formattedResult = data.res.map((item) => {
            return `PID: ${item.productId} (${item.quota} Hrg ${item.price})`;
        });

        playSound('./sounds/ting.wav'); // Putar suara untuk sukses
        res.status(200).json({
            nomor: to,
            produk: formattedResult,
        });
    } catch (error) {
        playSound('sounds/error.wav'); // Putar suara untuk error lainnya
        console.error('Error fetching data from UTAMA API:', error);
        res.status(500).json({ error: "Failed to fetch data from UTAMA API" });
    }
}
