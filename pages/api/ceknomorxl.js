// pages/api/check-number.js

const TYPES = ['package', '4GStatus', 'dukcapil', 'tenure', 'balance', 'SPExpDate'];

export default async function handler(req, res) {
  const { username, to } = req.query;

  if (!username || !to) {
    return res.status(400).json({ error: 'Parameter wajib: username, to' });
  }

  try {
    const responses = await Promise.all(
      TYPES.map(type =>
        fetch(`http://localhost:17000/cek_nomor?username=${username}&to=${to}&type=${type}`)
          .then(r => r.json())
          .catch(() => null)
      )
    );

    // Cek error batas pengecekan
    const limitError = responses.find(r => 
      r?.result?.errorCode === "10" && r?.statusCode === 404
    );

    if (limitError) {
      return res
        .status(404)
        .send(`Error: ${limitError.result.errorMessage}`);
    }

    const mergedData = responses.reduce((acc, response) => {
      if (response?.result?.data) {
        return { ...acc, ...response.result.data };
      }
      return acc;
    }, {});

    const formattedData = formatResponse(mergedData);

    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(formattedData);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

function formatResponse(data) {
  let result = [];

  // Fungsi untuk memformat tanggal
  const formatDate = (isoString) => {
    if (!isoString) return '-';

    try {
      const date = new Date(isoString);
      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Jakarta',
      };

      return date.toLocaleDateString('id-ID', options);
    } catch (e) {
      return isoString; // Fallback ke format asli jika gagal parse
    }
  };

  // Bagian informasi umum
  if (data.tenure) result.push(`umur kartu: ${data.tenure}`);
  if (data.expDate) result.push(`Masa aktif: ${formatDate(data.expDate)}`);
  if (data.dukcapil) result.push(`dukcapil: ${data.dukcapil}`);
  if (data.status) result.push(`Status 4G: ${data.status}`);

  // Tambahkan newline sebelum info paket
  if (result.length > 0) result.push('');

  // Bagian info paket
  if (data.packageInfo && Array.isArray(data.packageInfo)) {
    result.push('Info Paket Aktif:');

    let packageCount = 1;
    for (const pkgGroup of data.packageInfo) {
      if (!Array.isArray(pkgGroup)) continue;

      for (const pkg of pkgGroup) {
        const packageName = pkg?.packages?.name || '-';
        const expDate = pkg?.packages?.expDate || '-';
        const benefits = pkg?.benefits || [];

        for (const benefit of benefits) {
          result.push(
            `Paket ${packageCount}`,
            `Nama Paket: ${packageName}`,
            `expDate: ${formatDate(expDate)}`,
            `type: ${benefit.type || '-'}`,
            `benefits: ${benefit.bname || '-'}`,
            `Kuota: ${benefit.quota || '-'}`,
            `Tersisa: ${benefit.remaining || '-'}\n`
          );
          packageCount++;
        }
      }
    }

    if (packageCount === 1) {
      result.push('Tidak ada paket aktif');
    }
  }

  return result.join('\n') || 'Tidak ada informasi yang tersedia';
}