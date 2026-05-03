// frontend/src/components/IssueCertification.jsx
// Form for Regulators to issue or revoke certifications on-chain via VerificationLog.

import { useState } from "react";

export default function IssueCertification({ verificationLog, signer }) {
  const [mode, setMode]           = useState("issue"); // "issue" | "revoke"
  const [productId, setProductId] = useState("");
  const [certType, setCertType]   = useState("");
  const [documentCID, setDocCID]  = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [certId, setCertId]       = useState("");
  const [loading, setLoading]     = useState(false);
  const [msg, setMsg]             = useState("");
  const [isError, setIsError]     = useState(false);

  async function handleIssue(e) {
    e.preventDefault();
    if (!verificationLog || !signer) { setMsg("Connect wallet first."); setIsError(true); return; }
    if (!productId)  { setMsg("Product ID is required."); setIsError(true); return; }
    if (!certType.trim()) { setMsg("Certification type is required."); setIsError(true); return; }
    if (!documentCID.trim()) { setMsg("Document CID is required."); setIsError(true); return; }

    const expiry = expiresAt
      ? Math.floor(new Date(expiresAt).getTime() / 1000)
      : 0;

    setLoading(true);
    setMsg("Sending transaction…");
    setIsError(false);

    try {
      const tx = await verificationLog.issueCertification(
        Number(productId),
        certType.trim(),
        documentCID.trim(),
        expiry
      );
      setMsg("Transaction submitted — waiting for confirmation…");
      const receipt = await tx.wait();

      const event = receipt.logs
        .map((log) => { try { return verificationLog.interface.parseLog(log); } catch { return null; } })
        .find((ev) => ev && ev.name === "CertificationIssued");

      const newCertId = event ? event.args.certId.toString() : "?";
      setMsg(`Certification issued! Cert ID: ${newCertId} · Tx: ${receipt.hash.slice(0, 10)}…`);
      setIsError(false);
      setProductId("");
      setCertType("");
      setDocCID("");
      setExpiresAt("");
    } catch (err) {
      setMsg(err.reason || err.message);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(e) {
    e.preventDefault();
    if (!verificationLog || !signer) { setMsg("Connect wallet first."); setIsError(true); return; }
    if (!certId) { setMsg("Cert ID is required."); setIsError(true); return; }

    setLoading(true);
    setMsg("Sending transaction…");
    setIsError(false);

    try {
      const tx = await verificationLog.revokeCertification(Number(certId));
      setMsg("Transaction submitted — waiting for confirmation…");
      const receipt = await tx.wait();
      setMsg(`Certification #${certId} revoked · Tx: ${receipt.hash.slice(0, 10)}…`);
      setIsError(false);
      setCertId("");
    } catch (err) {
      setMsg(err.reason || err.message);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2>Regulator Dashboard</h2>
      <p style={{ color: "#6c757d", fontSize: "0.875rem", marginTop: 0 }}>
        Requires Regulator role. Issue quality certifications linked to IPFS documents,
        or revoke existing ones.
      </p>

      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button onClick={() => { setMode("issue"); setMsg(""); }} style={mode === "issue" ? toggleActive : toggleInactive}>
          Issue Certification
        </button>
        <button onClick={() => { setMode("revoke"); setMsg(""); }} style={mode === "revoke" ? toggleActive : toggleInactive}>
          Revoke Certification
        </button>
      </div>

      {/* Issue form */}
      {mode === "issue" && (
        <form onSubmit={handleIssue} style={{ maxWidth: 480 }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Product ID *</label>
            <input
              type="number" min="1" placeholder="e.g. 1"
              value={productId} onChange={(e) => setProductId(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Certification Type *</label>
            <input
              type="text" placeholder="e.g. FDA Approval, ISO 9001, CE Mark"
              value={certType} onChange={(e) => setCertType(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Document CID (IPFS) *</label>
            <input
              type="text" placeholder="ipfs://Qm..."
              value={documentCID} onChange={(e) => setDocCID(e.target.value)}
              style={inputStyle}
            />
            <p style={noteStyle}>IPFS CID of the certificate document stored via Pinata.</p>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Expiry Date (optional)</label>
            <input
              type="date"
              value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
              style={inputStyle}
            />
            <p style={noteStyle}>Leave blank for a certification with no expiry.</p>
          </div>

          <button type="submit" disabled={loading} style={btnGreen}>
            {loading ? "Issuing…" : "Issue Certification"}
          </button>
        </form>
      )}

      {/* Revoke form */}
      {mode === "revoke" && (
        <form onSubmit={handleRevoke} style={{ maxWidth: 480 }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Certification ID *</label>
            <input
              type="number" min="1" placeholder="e.g. 1"
              value={certId} onChange={(e) => setCertId(e.target.value)}
              style={inputStyle}
            />
            <p style={noteStyle}>
              Find the cert ID in the Lookup Product tab under Certifications.
            </p>
          </div>

          <button type="submit" disabled={loading} style={btnRed}>
            {loading ? "Revoking…" : "Revoke Certification"}
          </button>
        </form>
      )}

      {msg && (
        <p style={{ marginTop: 12, fontSize: "0.875rem", color: isError ? "#dc3545" : "#198754" }}>
          {msg}
        </p>
      )}
    </>
  );
}

const fieldStyle  = { marginBottom: 14 };
const labelStyle  = { display: "block", fontWeight: 500, marginBottom: 4, fontSize: "0.875rem" };
const noteStyle   = { fontSize: "0.8rem", color: "#6c757d", margin: "4px 0 0" };
const inputStyle  = {
  width: "100%", padding: "8px 12px", border: "1px solid #dee2e6",
  borderRadius: 6, fontSize: "0.95rem", boxSizing: "border-box",
};
const btnGreen = {
  padding: "9px 20px", background: "#198754", color: "#fff",
  border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.95rem", fontWeight: 500,
};
const btnRed = {
  padding: "9px 20px", background: "#dc3545", color: "#fff",
  border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.95rem", fontWeight: 500,
};
const toggleActive = {
  padding: "7px 16px", background: "#0d6efd", color: "#fff",
  border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.875rem", fontWeight: 600,
};
const toggleInactive = {
  padding: "7px 16px", background: "#fff", color: "#0d6efd",
  border: "1px solid #0d6efd", borderRadius: 6, cursor: "pointer", fontSize: "0.875rem",
};
