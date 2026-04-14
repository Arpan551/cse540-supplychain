// frontend/src/App.jsx
// Supply Chain Provenance System — CSE 540 Group 20
// Connects to MetaMask, reads live on-chain data from ProductRegistry
// and VerificationLog contracts deployed on Hardhat local network or Sepolia.

//testing
import { useState, useEffect } from "react";
import { useContracts, CONTRACT_ADDRESSES } from "./useContracts.js";
import ProvenanceTimeline from "./components/ProvenanceTimeline.jsx";
import RegisterProduct from "./components/RegisterProduct.jsx";
import TransferCustody from "./components/TransferCustody.jsx";
import ConfirmDelivery from "./components/ConfirmDelivery.jsx";
import styles from "./App.module.css";

const STATUS_LABELS = ["Registered", "Shipped", "InStorage", "Delivered", "Flagged"];
const STATUS_COLORS = ["#6c757d", "#0d6efd", "#0dcaf0", "#198754", "#dc3545"];

export default function App() {
  const { account, signer, provider, error: walletError, connect, registry, verificationLog } =
    useContracts();

  const [tab, setTab]               = useState("lookup");
  const [productId, setProductId]   = useState("");
  const [product, setProduct]       = useState(null);
  const [history, setHistory]       = useState([]);
  const [certs, setCerts]           = useState([]);
  const [loading, setLoading]       = useState(false);
  const [statusMsg, setStatusMsg]   = useState("");
  const [totalProducts, setTotal]   = useState(null);

  const addressesConfigured =
    CONTRACT_ADDRESSES.productRegistry && CONTRACT_ADDRESSES.verificationLog;

  // Fetch total product count whenever the registry becomes available
  useEffect(() => {
    if (!registry) return;
    registry.totalProducts()
      .then((n) => setTotal(Number(n)))
      .catch(() => {});
  }, [registry]);

  async function lookupProduct() {
    if (!registry) { setStatusMsg("Connect wallet first."); return; }
    if (!productId) { setStatusMsg("Enter a product ID."); return; }
    setLoading(true);
    setStatusMsg("");
    setProduct(null);
    setHistory([]);
    setCerts([]);

    try {
      const p = await registry.getProduct(Number(productId));
      const h = await registry.getHistory(Number(productId));
      const certIds = await verificationLog.getCertificationsForProduct(Number(productId));
      const certData = await Promise.all(
        certIds.map((id) => verificationLog.getCertification(id))
      );

      setProduct({
        id: p.id.toString(),
        batchId: p.batchId,
        currentOwner: p.currentOwner,
        status: Number(p.status),
        metadataCID: p.metadataCID,
        createdAt: new Date(Number(p.createdAt) * 1000).toLocaleString(),
        updatedAt: new Date(Number(p.updatedAt) * 1000).toLocaleString(),
      });

      setHistory(
        h.map((entry) => ({
          actor: entry.actor,
          statusBefore: Number(entry.statusBefore),
          statusAfter: Number(entry.statusAfter),
          note: entry.note,
          timestamp: new Date(Number(entry.timestamp) * 1000).toLocaleString(),
        }))
      );

      setCerts(
        certData.map((c, i) => ({
          certId: certIds[i].toString(),
          certType: c.certType,
          issuedBy: c.issuedBy,
          documentCID: c.documentCID,
          isValid: c.isValid,
          issuedAt: new Date(Number(c.issuedAt) * 1000).toLocaleString(),
        }))
      );

      // Refresh total after a lookup (in case a new product was just registered)
      registry.totalProducts().then((n) => setTotal(Number(n))).catch(() => {});
      setStatusMsg(`Product ${productId} loaded.`);
    } catch (err) {
      setStatusMsg("Error: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div>
          <h1>Supply Chain Provenance</h1>
          <p className={styles.subtitle}>CSE 540 · Group 20 · Ethereum + IPFS</p>
        </div>
        {totalProducts !== null && (
          <div className={styles.stat}>
            <span className={styles.statNum}>{totalProducts}</span>
            <span className={styles.statLabel}>products on-chain</span>
          </div>
        )}
      </header>

      {/* Wallet bar */}
      <div className={styles.walletBar}>
        {account ? (
          <span className={styles.connected}>
            Connected: {account.slice(0, 6)}…{account.slice(-4)}
          </span>
        ) : (
          <button className={styles.btnPrimary} onClick={connect}>
            Connect MetaMask
          </button>
        )}
        {walletError && <span className={styles.error}>{walletError}</span>}
      </div>

      {/* Contract address warning */}
      {!addressesConfigured && (
        <div className={styles.warning}>
          Contract addresses not configured. Set <code>VITE_PRODUCT_REGISTRY</code> and{" "}
          <code>VITE_VERIFICATION_LOG</code> in <code>frontend/.env</code> then restart Vite.
          (See <code>deployed-addresses.json</code> after running deploy.js.)
        </div>
      )}

      {/* Tab nav */}
      <nav className={styles.tabs}>
        {[
          ["lookup",   "Lookup Product"],
          ["register", "Register Product"],
          ["transfer", "Transfer Custody"],
          ["deliver",  "Confirm Delivery"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={tab === key ? styles.tabActive : styles.tab}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* ── Tab: Lookup ── */}
      {tab === "lookup" && (
        <section className={styles.section}>
          <h2>Product Provenance Lookup</h2>
          <p className={styles.hint}>
            Anyone can look up a product's full on-chain journey. Enter a product ID (e.g. 1, 2, 3
            after running seed.js).
          </p>
          <div className={styles.row}>
            <input
              type="number"
              min="1"
              placeholder="Product ID"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookupProduct()}
              className={styles.input}
            />
            <button
              className={styles.btnPrimary}
              onClick={lookupProduct}
              disabled={loading}
            >
              {loading ? "Loading…" : "Lookup"}
            </button>
          </div>

          {statusMsg && <p className={styles.status}>{statusMsg}</p>}

          {product && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3>Product #{product.id} — {product.batchId}</h3>
                <span
                  className={styles.badge}
                  style={{ background: STATUS_COLORS[product.status] }}
                >
                  {STATUS_LABELS[product.status]}
                </span>
              </div>
              <dl className={styles.dl}>
                <dt>Current Owner</dt>
                <dd className={styles.mono}>{product.currentOwner}</dd>
                <dt>Metadata (IPFS)</dt>
                <dd className={styles.mono}>{product.metadataCID || "—"}</dd>
                <dt>Registered</dt>
                <dd>{product.createdAt}</dd>
                <dt>Last Updated</dt>
                <dd>{product.updatedAt}</dd>
              </dl>

              {/* Certifications */}
              {certs.length > 0 && (
                <>
                  <h4>Certifications</h4>
                  <ul className={styles.certList}>
                    {certs.map((c) => (
                      <li key={c.certId} className={c.isValid ? styles.certValid : styles.certRevoked}>
                        <strong>{c.certType}</strong> (cert #{c.certId})
                        {" "}{c.isValid ? "✓ Valid" : "✗ Revoked"} · {c.issuedAt}
                        <br />
                        <span className={styles.mono}>{c.documentCID}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* Provenance timeline */}
              <h4>Provenance History ({history.length} events)</h4>
              <ProvenanceTimeline history={history} statusLabels={STATUS_LABELS} />
            </div>
          )}
        </section>
      )}

      {/* ── Tab: Register ── */}
      {tab === "register" && (
        <section className={styles.section}>
          <RegisterProduct
            registry={registry}
            signer={signer}
            onSuccess={(id) => {
              setTotal((t) => (t !== null ? t + 1 : t));
              setTab("lookup");
              setProductId(id.toString());
            }}
          />
        </section>
      )}

      {/* ── Tab: Transfer ── */}
      {tab === "transfer" && (
        <section className={styles.section}>
          <TransferCustody registry={registry} signer={signer} />
        </section>
      )}

      {/* ── Tab: Confirm Delivery ── */}
      {tab === "deliver" && (
        <section className={styles.section}>
          <ConfirmDelivery registry={registry} signer={signer} />
        </section>
      )}
    </div>
  );
}
