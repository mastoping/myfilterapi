import crypto from "crypto";

const clientId = "BRN-0250-1727469099838"; // Masukkan Client ID Anda
const secretKey = "SK-wIGpZdwNU6I3DqJMwkK0"; // Masukkan Secret Key Anda
const targetPath = "/checkout/v1/payment";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { amount, invoice_number, customer_id, customer_name, customer_email, payment_due_date } =
      req.body;

    // 1. Generate unique order ID and timestamp
    const orderID = invoice_number || Date.now().toString();
    const requestId = orderID;
    const requestDate = new Date().toISOString();

    // 2. Construct request body
    const requestBody = {
      order: {
        amount: Number(amount),
        invoice_number: orderID,
      },
      payment: {
        payment_due_date: Number(payment_due_date), // Minutes
      },
      customer: {
        id: customer_id,
        name: customer_name,
        email: customer_email,
      },
    };

    // 3. Generate Digest using SHA256 and Base64 encode
    const digestValue = crypto
      .createHash("sha256")
      .update(JSON.stringify(requestBody))
      .digest("base64");

    // 4. Generate Signature
    const componentSignature = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${requestDate}\nRequest-Target:${targetPath}\nDigest:${digestValue}`;
    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(componentSignature)
      .digest("base64");

    // 5. Send request to DOKU API
    try {
      const response = await fetch("https://api.doku.com" + targetPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Client-Id": clientId,
          "Request-Id": requestId,
          "Request-Timestamp": requestDate,
          Signature: `HMACSHA256=${signature}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      res.status(response.status).json(data); // Pass response to frontend
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
