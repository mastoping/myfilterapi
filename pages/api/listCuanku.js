// pages/api/listCuanku.js
export default async function handler(req, res) {
    const { username, to, json } = req.query;
  
    try {
      // Fetch data dari API utama
      const response = await fetch(`http://localhost:17000/listCuanku?username=${username}&to=${to}&json=1`);
      const data = await response.json();
  
      // Proses filtering dan transformasi data
      const processedData = data.map((item, index) => {
        // Ekstrak teks sampai 'hr' atau 'hr,'
        const productNameMatch = item.product_name.match(/(.*?hr,?)/);
        const shortProductName = productNameMatch ? productNameMatch[0].trim() : item.product_name;
  
        return {
          pid: index + 1, // Generate PID sesuai urutan dari API utama
          product_name: shortProductName,
          dompul_price: item.dompul_price,
        };
      });
  
      // Format response akhir
      const pidList = processedData.map(
        (item) => `PID: ${item.pid} (${item.product_name} hrg ${item.dompul_price})`
      ).join(', ');
  
      const finalResponse = `nomor anda ${to}, SN= ${pidList}.done`;
  
      res.status(200).send(finalResponse);
  
    } catch (error) {
      res.status(500).json({ error: `nomor anda ${to} Produk Tidak tersedia saat ini atau coba lagi setelah beberapa saat` });
    }
  }