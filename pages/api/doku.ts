import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const DOKU_AUTH_URL = 'https://api.doku.com/oauth/token'; // URL untuk otentikasi
const DOKU_PAYMENT_URL = 'https://api.doku.com/checkout/v1/payment-links'; // URL untuk membuat payment link
const CLIENT_ID = 'BRN-0250-1727469099838'; // Ganti dengan client ID Anda
const SECRET_KEY = 'SK-wIGpZdwNU6I3DqJMwkK0'; // Ganti dengan secret key Anda

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { amount, orderId, description } = req.body;

    try {
      // 1. Dapatkan access token
      const authResponse = await axios.post(
        DOKU_AUTH_URL,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: CLIENT_ID,
          client_secret: SECRET_KEY,
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      const accessToken = authResponse.data.access_token;

      // 2. Buat payment link
      const response = await axios.post(
        DOKU_PAYMENT_URL,
        {
          order: {
            invoice_number: orderId,
            amount: amount,
          },
          payment: {
            description,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      res.status(200).json(response.data);
    } catch (error: any) {
      console.error('Error:', error.response?.data || error.message);
      res.status(500).json({ error: error.response?.data || error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
