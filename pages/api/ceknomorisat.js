// pages/api/statusPaket.js
import axios from 'axios';

export default async function handler(req, res) {
  const { username, to } = req.query;

  try {
    // Panggil API lokal
    const response = await axios.get(`http://localhost:48000/statusPaket`, {
      params: {
        username,
        to,
        json: 1,
      },
    });

    // Proses data
    const formattedData = response.data.map((item) => {
      const quotas = JSON.parse(item.quotas).map((quota) => {
        return `${quota.remainingquota}${quota.quotaunit} - ${quota.name}`;
      }).join(', ');

      return {
        packagename: item.packagename,
        activationdate: item.activationdate,
        enddate: item.enddate,
        quotas,
      };
    });

    // Format respons
    const result = {
      noPelanggan: to,
      packages: formattedData.map((item) => ({
        namaPaket: item.packagename,
        tanggalReload: item.activationdate,
        aktifSampai: item.enddate,
        sisaKuota: item.quotas,
      })),
    };

    // Kirim respons
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}