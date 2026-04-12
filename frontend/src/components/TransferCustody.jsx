// frontend/src/components/TransferCustody.jsx
// Form for Producers and Distributors to transfer custody of a product.

import { useState } from "react";

export default function TransferCustody({ registry, signer }) {
  const [productId, setProductId] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [note, setNote]           = useState("");
  const [loading, setLoading]     = useState(false);
  const [msg, setMsg]             = useState("");
  const [isError, setIsError]     = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!registry || !signer) { setMsg("Connect wallet first."); setIsError(true); return; }
    if (!productId) { setMsg("Product ID is required."); setIsError(true); return; }
    if (!toAddress.match(/^0x[0-9a-fA-F]{40}$/)) {
      setMsg("Enter a valid Ethereum address.");
      setIsError(true);
      return;
    }

    setLoading(true);
    setMsg("Sending transaction…");
    setIsError(false);

    try {
      const tx = await registry.transferCustody(
        Number(productId),
        toAddress.trim(),
        note.trim()
      );
      setMsg("Transaction submitted — waiting for confirmation…");
      const receipt = await tx.wait();
      setMsg(`Custody transferred! Tx: ${receipt.hash.slice(0, 10)}…`);
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
      <h2>Transfer Custody</h2>
      <p style={{ color: "#6c757d", fontSize: "0.875rem", marginTop: 0 }}>
        Requires Producer or Distributor role and you must be the current owner of the product.
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

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Transfer To (address) *</label>
          <input
            type="text"
            placeholder="0x..."
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Note / Shipment Details</label>
          <input
            type="text"
            placeholder="e.g. Shipped from warehouse Chicago"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={inputStyle}
          />
          <p style={{ fontSize: "0.8rem", color: "#6c757d", margin: "4px 0 0" }}>
            Stored on-chain as part of the provenance trail.
          </p>
        </div>

        <button type="submit" disabled={loading} style={btnStyle}>
          {loading ? "Transferring…" : "Transfer Custody"}
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

const labelStyle = {
  display: "block",
  fontWeight: 500,
  marginBottom: 4,
  fontSize: "0.875rem",
};

const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #dee2e6",
  borderRadius: 6,
  fontSize: "0.95rem",
  boxSizing: "border-box",
};

const btnStyle = {
  padding: "9px 20px",
  background: "#0d6efd",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: "0.95rem",
  fontWeight: 500,
};
