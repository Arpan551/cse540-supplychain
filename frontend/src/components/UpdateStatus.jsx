// frontend/src/components/UpdateStatus.jsx
// Form for authorized stakeholders (Distributor, Retailer, Regulator) to log
// a status update for a product — e.g. marking it as InStorage or Flagged.

import { useState } from "react";

const STATUS_OPTIONS = [
  { value: 0, label: "Registered" },
  { value: 1, label: "Shipped" },
  { value: 2, label: "InStorage" },
  { value: 3, label: "Delivered" },
  { value: 4, label: "Flagged" },
];

export default function UpdateStatus({ registry, signer }) {
  const [productId, setProductId] = useState("");
  const [newStatus, setNewStatus] = useState("2");
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
      const tx = await registry.updateStatus(
        Number(productId),
        Number(newStatus),
        note.trim()
      );
      setMsg("Transaction submitted — waiting for confirmation…");
      const receipt = await tx.wait();
      const label = STATUS_OPTIONS.find((s) => s.value === Number(newStatus))?.label;
      setMsg(`Status updated to ${label}! Tx: ${receipt.hash.slice(0, 10)}…`);
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
      <h2>Update Product Status</h2>
      <p style={{ color: "#6c757d", fontSize: "0.875rem", marginTop: 0 }}>
        Requires Producer, Distributor, Retailer, or Regulator role. Use this to log
        a status change such as warehouse receipt, cold-storage entry, or a quality flag.
      </p>

      <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Product ID *</label>
          <input
            type="number" min="1" placeholder="e.g. 1"
            value={productId} onChange={(e) => setProductId(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>New Status *</label>
          <select
            value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <p style={noteStyle}>
            <strong>Flagged</strong> = quality failure or recall.{" "}
            <strong>InStorage</strong> = warehouse receipt.
          </p>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Note / Location Details</label>
          <input
            type="text"
            placeholder="e.g. Arrived at cold-storage, Memphis TN"
            value={note} onChange={(e) => setNote(e.target.value)}
            style={inputStyle}
          />
          <p style={noteStyle}>Stored permanently on-chain as part of the provenance trail.</p>
        </div>

        <button type="submit" disabled={loading} style={btnStyle}>
          {loading ? "Updating…" : "Update Status"}
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

const fieldStyle = { marginBottom: 14 };
const labelStyle = { display: "block", fontWeight: 500, marginBottom: 4, fontSize: "0.875rem" };
const noteStyle  = { fontSize: "0.8rem", color: "#6c757d", margin: "4px 0 0" };
const inputStyle = {
  width: "100%", padding: "8px 12px", border: "1px solid #dee2e6",
  borderRadius: 6, fontSize: "0.95rem", boxSizing: "border-box",
};
const btnStyle = {
  padding: "9px 20px", background: "#0dcaf0", color: "#000",
  border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.95rem", fontWeight: 500,
};
