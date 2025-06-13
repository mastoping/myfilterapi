const { exec } = require('child_process');

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
    const { username, pin, to, normal_price } = req.query;

    // Validasi parameter wajib dengan menyertakan to jika ada
    if (!username || !pin || !to || !normal_price) {
        const errorResponse = { 
            error: 'Parameter wajib tidak lengkap',
            ...(to && { to }) // Sertakan to hanya jika ada
        };
        return res.status(400).json(errorResponse);
    }

    try {
        // 1. Ambil list produk dari API asli
        const listParams = new URLSearchParams({
            username,
            to,
            json: '1'
        });

        playSound("sounds/super.wav");
        
        const listResponse = await fetch(`http://localhost:17000/listCuanku?${listParams}`);
        if (!listResponse.ok) {
            throw new Error(`Gagal mengambil daftar produk untuk nomor: ${to}`) ;
        }
        
        const products = await listResponse.json();

        // 2. Cari produk yang sesuai
        const targetPrice = parseFloat(normal_price);
        const matchedProducts = products.filter(product => 
            parseFloat(product.normal_price) === targetPrice
        );
        

        if (matchedProducts.length === 0) {
            return res.status(404).json({ 
                error: 'Produk tidak ditemukan',
                to: to  // Tambahkan field to terpisah
            });
        }

        // Urutkan berdasarkan dompul_price termurah
        matchedProducts.sort((a, b) => {
            const priceA = parseFloat(a.dompul_price);
            const priceB = parseFloat(b.dompul_price);
            return priceA - priceB;
        });

        const matchedProduct = matchedProducts[0];

        // 3. Generate ID Transaksi
        const now = new Date();
        const trxid = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}`;

        // 4. Bangun URL pembayaran
        const paymentParams = new URLSearchParams({
            username,
            pin,
            to,
            custom_code: matchedProduct.custom_code,
            idtrx: trxid
        });
        
        setTimeout(function() {
            playSound("sounds/coc.wav");
          }, 1000);
          

        const paymentResponse = await fetch(`http://localhost:17000/cuanku?${paymentParams}`);

        const responseText = await paymentResponse.text(); // Baca body sebagai teks
        
        let result;
        try {
            result = JSON.parse(responseText);
        } catch {
            result = { message: responseText };
        }

        // Kirim respons
        res.status(200).json(result);

    } catch (error) {
        res.status(500).json({ 
            error: error.message || 'Terjadi kesalahan pada server',
            to: to,  // Selalu sertakan to
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}