// frontend/src/components/ConfirmDelivery.jsx
// Form for Retailers to confirm final delivery of a product.

import { useState } from "react";

export default function ConfirmDelivery({ registry, signer }) {
  const [productId, setProductId] = useState("");
  const [note, setNote]           = useState("");
  const [loading, setLoading]     = useState(false);
  const [msg, setMsg]             = useState("");
  const [isError, setIsError]     = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!registry || !signer) { setMsg("Connect wallet first."); setIsError(true); return; }
    if (!productId) { setMsg("Product ID is required."); setIsError(true); return; }

    setLoading(true);
    setMsg("Sending transaction…");
    setIsError(false);

    try {
      const tx = await registry.confirmDelivery(Number(productId), note.trim());
      setMsg("Transaction submitted — waiting for confirmation…");
      const receipt = await tx.wait();
      setMsg(`Delivery confirmed! Tx: ${receipt.hash.slice(0, 10)}…`);
      setIsError(false);
      setNote("");
    } catch (err) {
      setMsg(err.reason || err.message);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2>Confirm Delivery</h2>
      <p style={{ color: "#6c757d", fontSize: "0.875rem", marginTop: 0 }}>
        Requires Retailer role. Sets the product status to Delivered and logs the final
        custody event on-chain.
      </p>

      <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Product ID *</label>
          <input
            type="number"
            min="1"
            placeholder="e.g. 1"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Delivery Note</label>
          <input
            type="text"
            placeholder="e.g. Received at store, Austin TX"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={inputStyle}
          />
        </div>

        <button type="submit" disabled={loading} style={btnStyle}>
          {loading ? "Confirming…" : "Confirm Delivery"}
        </button>
      </form>

      {msg && (
        <p style={{ marginTop: 12, fontSize: "0.875rem", color: isError ? "#dc3545" : "#198754" }}>
          {msg}
        </p>
      )}
    </>
  );
}

const labelStyle = { display: "block", fontWeight: 500, marginBottom: 4, fontSize: "0.875rem" };
const inputStyle = {
  width: "100%", padding: "8px 12px", border: "1px solid #dee2e6",
  borderRadius: 6, fontSize: "0.95rem", boxSizing: "border-box",
};
const btnStyle = {
  padding: "9px 20px", background: "#198754", color: "#fff",
  border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.95rem", fontWeight: 500,
};
