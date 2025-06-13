import { useState } from "react";

export default function PaymentForm() {
  const [formData, setFormData] = useState({
    amount: "",
    invoice_number: "",
    customer_id: "",
    customer_name: "",
    customer_email: "",
    payment_due_date: 120,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Kirim data ke backend PHP
      const response = await fetch("C:/xampp/htdocs/dashboard/doku.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      alert(`Response: ${JSON.stringify(data)}`);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to submit data.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Amount:
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
        />
      </label>
      <label>
        Invoice Number:
        <input
          type="text"
          name="invoice_number"
          value={formData.invoice_number}
          onChange={handleChange}
        />
      </label>
      <label>
        Customer ID:
        <input
          type="text"
          name="customer_id"
          value={formData.customer_id}
          onChange={handleChange}
        />
      </label>
      <label>
        Customer Name:
        <input
          type="text"
          name="customer_name"
          value={formData.customer_name}
          onChange={handleChange}
        />
      </label>
      <label>
        Customer Email:
        <input
          type="email"
          name="customer_email"
          value={formData.customer_email}
          onChange={handleChange}
        />
      </label>
      <label>
        Payment Due Date:
        <input
          type="number"
          name="payment_due_date"
          value={formData.payment_due_date}
          onChange={handleChange}
        />
      </label>
      <button type="submit">Submit</button>
    </form>
  );
}
