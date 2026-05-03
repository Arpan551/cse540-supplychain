// frontend/src/components/AdminPanel.jsx
// Admin-only panel for assigning stakeholder roles via AccessControl contract.
// Only the deployer address (DEFAULT_ADMIN_ROLE holder) can grant roles.

import { useState } from "react";

const ROLE_OPTIONS = [
  { label: "Producer",    fn: "addProducer" },
  { label: "Distributor", fn: "addDistributor" },
  { label: "Retailer",    fn: "addRetailer" },
  { label: "Regulator",   fn: "addRegulator" },
];

export default function AdminPanel({ accessControl, signer }) {
  const [address, setAddress] = useState("");
  const [role, setRole]       = useState("addProducer");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState("");
  const [isError, setIsError] = useState(false);

  // Role lookup state
  const [checkAddr, setCheckAddr]     = useState("");
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking]       = useState(false);

  async function handleAssign(e) {
    e.preventDefault();
    if (!accessControl || !signer) { setMsg("Connect wallet first."); setIsError(true); return; }
    if (!address.match(/^0x[0-9a-fA-F]{40}$/)) {
      setMsg("Enter a valid Ethereum address.");
      setIsError(true);
      return;
    }

    setLoading(true);
    setMsg("Sending transaction…");
    setIsError(false);

    try {
      const tx = await accessControl[role](address.trim());
      setMsg("Transaction submitted — waiting for confirmation…");
      const receipt = await tx.wait();
      const label = ROLE_OPTIONS.find((r) => r.fn === role)?.label;
      setMsg(`${label} role granted to ${address.slice(0, 8)}…${address.slice(-6)} · Tx: ${receipt.hash.slice(0, 10)}…`);
      setIsError(false);
      setAddress("");
    } catch (err) {
      setMsg(err.reason || err.message);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheck(e) {
    e.preventDefault();
    if (!accessControl) { setCheckResult({ error: "Connect wallet first." }); return; }
    if (!checkAddr.match(/^0x[0-9a-fA-F]{40}$/)) {
      setCheckResult({ error: "Enter a valid Ethereum address." });
      return;
    }

    setChecking(true);
    setCheckResult(null);

    try {
      const [isProd, isDist, isRet, isReg] = await Promise.all([
        accessControl.isProducer(checkAddr),
        accessControl.isDistributor(checkAddr),
        accessControl.isRetailer(checkAddr),
        accessControl.isRegulator(checkAddr),
      ]);
      setCheckResult({ isProd, isDist, isRet, isReg });
    } catch (err) {
      setCheckResult({ error: err.message });
    } finally {
      setChecking(false);
    }
  }

  return (
    <>
      <h2>Admin Panel</h2>
      <p style={{ color: "#6c757d", fontSize: "0.875rem", marginTop: 0 }}>
        Only the deployer account (DEFAULT_ADMIN_ROLE) can grant roles. Use Hardhat account #0
        on localhost, or the deployer wallet on Sepolia.
      </p>

      {/* ── Assign Role ── */}
      <h3 style={{ marginBottom: 12 }}>Grant Role</h3>
      <form onSubmit={handleAssign} style={{ maxWidth: 480 }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Wallet Address *</label>
          <input
            type="text" placeholder="0x..."
            value={address} onChange={(e) => setAddress(e.target.value)}
            style={inputStyle}
          />
          <p style={noteStyle}>The address that will receive the role.</p>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Role *</label>
          <select
            value={role} onChange={(e) => setRole(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.fn} value={r.fn}>{r.label}</option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={loading} style={btnStyle}>
          {loading ? "Granting…" : "Grant Role"}
        </button>
      </form>

      {msg && (
        <p style={{ marginTop: 12, fontSize: "0.875rem", color: isError ? "#dc3545" : "#198754" }}>
          {msg}
        </p>
      )}

      <hr style={{ margin: "28px 0", border: "none", borderTop: "1px solid #dee2e6" }} />

      {/* ── Check Roles ── */}
      <h3 style={{ marginBottom: 12 }}>Check Roles for Address</h3>
      <form onSubmit={handleCheck} style={{ maxWidth: 480 }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Wallet Address</label>
          <input
            type="text" placeholder="0x..."
            value={checkAddr} onChange={(e) => setCheckAddr(e.target.value)}
            style={inputStyle}
          />
        </div>
        <button type="submit" disabled={checking} style={{ ...btnStyle, background: "#6c757d" }}>
          {checking ? "Checking…" : "Check Roles"}
        </button>
      </form>

      {checkResult && !checkResult.error && (
        <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            ["Producer",    checkResult.isProd],
            ["Distributor", checkResult.isDist],
            ["Retailer",    checkResult.isRet],
            ["Regulator",   checkResult.isReg],
          ].map(([name, has]) => (
            <span
              key={name}
              style={{
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: "0.85rem",
                fontWeight: 600,
                background: has ? "#d1e7dd" : "#f8d7da",
                color:      has ? "#0f5132" : "#842029",
              }}
            >
              {name}: {has ? "✓" : "✗"}
            </span>
          ))}
        </div>
      )}
      {checkResult?.error && (
        <p style={{ color: "#dc3545", fontSize: "0.875rem", marginTop: 8 }}>{checkResult.error}</p>
      )}

      <hr style={{ margin: "28px 0", border: "none", borderTop: "1px solid #dee2e6" }} />

      {/* ── Quick Reference ── */}
      <h3 style={{ marginBottom: 8 }}>Hardhat Test Accounts</h3>
      <p style={{ fontSize: "0.875rem", color: "#6c757d", marginBottom: 8 }}>
        When running <code>npx hardhat node</code>, use these accounts for role assignment:
      </p>
      <table style={{ width: "100%", maxWidth: 560, fontSize: "0.8rem", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f8f9fa" }}>
            <th style={thStyle}>Account #</th>
            <th style={thStyle}>Role in seed.js</th>
            <th style={thStyle}>Address</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["0", "Admin (deployer)", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"],
            ["1", "Producer",        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"],
            ["2", "Distributor",     "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"],
            ["3", "Retailer",        "0x90F79bf6EB2c4f870365E785982E1f101E93b906"],
            ["4", "Regulator",       "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"],
          ].map(([num, role, addr]) => (
            <tr key={num} style={{ borderTop: "1px solid #dee2e6" }}>
              <td style={tdStyle}>#{num}</td>
              <td style={tdStyle}>{role}</td>
              <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: "0.75rem", wordBreak: "break-all" }}>{addr}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
  padding: "9px 20px", background: "#0d6efd", color: "#fff",
  border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.95rem", fontWeight: 500,
};
const thStyle = { padding: "6px 10px", textAlign: "left", fontWeight: 600 };
const tdStyle = { padding: "6px 10px" };
