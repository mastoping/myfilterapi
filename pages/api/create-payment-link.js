import React, { useState } from 'react';
import axios from 'axios';

const PaymentLinkCreator = () => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentLink, setPaymentLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const createPaymentLink = async () => {
    setIsLoading(true);
    setPaymentLink('');
    try {
      const response = await axios.post('/api/create-payment-link', {
        amount,
        description,
      });
      setPaymentLink(response.data.paymentLink);
    } catch (error) {
      console.error('Error creating payment link:', error);
      alert('Gagal membuat link pembayaran. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
      <h1>Buat Link Pembayaran DOKU</h1>
      <div style={{ marginBottom: '10px' }}>
        <label>Jumlah Pembayaran:</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Masukkan jumlah"
          style={{ width: '100%', padding: '8px', marginTop: '5px' }}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>Deskripsi:</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Masukkan deskripsi"
          style={{ width: '100%', padding: '8px', marginTop: '5px' }}
        />
      </div>
      <button
        onClick={createPaymentLink}
        disabled={isLoading || !amount || !description}
        style={{
          padding: '10px 20px',
          backgroundColor: '#0070f3',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginBottom: '10px',
        }}
      >
        {isLoading ? 'Loading...' : 'Buat Link'}
      </button>
      {paymentLink && (
        <div>
          <p>Link Pembayaran:</p>
          <a href={paymentLink} target="_blank" rel="noopener noreferrer">
            {paymentLink}
          </a>
        </div>
      )}
    </div>
  );
};

export default PaymentLinkCreator;
