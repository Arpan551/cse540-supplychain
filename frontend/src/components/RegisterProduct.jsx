// frontend/src/components/RegisterProduct.jsx
// Form for Producers to register a new product on-chain.

import { useState } from "react";

export default function RegisterProduct({ registry, signer, onSuccess }) {
  const [batchId, setBatchId]       = useState("");
  const [metadataCID, setMetadata]  = useState("");
  const [loading, setLoading]       = useState(false);
  const [msg, setMsg]               = useState("");
  const [isError, setIsError]       = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!registry || !signer) { setMsg("Connect wallet first."); setIsError(true); return; }
    if (!batchId.trim()) { setMsg("Batch ID is required."); setIsError(true); return; }

    setLoading(true);
    setMsg("Sending transaction…");
    setIsError(false);

    try {
      const tx = await registry.registerProduct(batchId.trim(), metadataCID.trim());
      setMsg("Transaction submitted — waiting for confirmation…");
      const receipt = await tx.wait();

      // Parse the ProductRegistered event to get the new product ID
      const event = receipt.logs
        .map((log) => { try { return registry.interface.parseLog(log); } catch { return null; } })
        .find((e) => e && e.name === "ProductRegistered");

      const newId = event ? event.args.productId.toString() : "?";
      setMsg(`Product registered! ID: ${newId} · Tx: ${receipt.hash.slice(0, 10)}…`);
      setIsError(false);
      setBatchId("");
      setMetadata("");
      if (onSuccess && newId !== "?") onSuccess(newId);
    } catch (err) {
      setMsg(err.reason || err.message);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2>Register a Product</h2>
      <p style={{ color: "#6c757d", fontSize: "0.875rem", marginTop: 0 }}>
        Requires Producer role. The new product gets a unique on-chain ID and its history
        starts immediately.
      </p>

      <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontWeight: 500, marginBottom: 4, fontSize: "0.875rem" }}>
            Batch ID *
          </label>
          <input
            type="text"
            placeholder="e.g. BATCH-PHARMA-2024-A"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            style={inputStyle}
          />
          <p style={{ fontSize: "0.8rem", color: "#6c757d", margin: "4px 0 0" }}>
            Your internal batch label — stored on-chain permanently.
          </p>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontWeight: 500, marginBottom: 4, fontSize: "0.875rem" }}>
            Metadata CID (IPFS)
          </label>
          <input
            type="text"
            placeholder="ipfs://Qm... (optional)"
            value={metadataCID}
            onChange={(e) => setMetadata(e.target.value)}
            style={inputStyle}
          />
          <p style={{ fontSize: "0.8rem", color: "#6c757d", margin: "4px 0 0" }}>
            IPFS CID of the product document (certificates, images). Leave blank for now.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={btnStyle}
        >
          {loading ? "Registering…" : "Register Product"}
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
