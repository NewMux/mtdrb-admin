import React from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import QRCode from "qrcode";
import { FiPrinter } from "react-icons/fi";
import {
  issueCredential,
  listMemberCredentials,
  revokeCredential,
  type CredentialType,
  type MemberCredential,
} from "../../api/accessControl";

interface MemberOption {
  id: string;
  name: string;
  email: string;
}

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white";

// A member's way in: a QR code (on their phone or a printed card), a card or keyfob,
// or the user id their fingerprint/face terminal knows them by. QR tokens and card
// numbers are stored hashed, so a QR code is shown once, when it is made.
export default function CredentialsPanel({ members }: { members: MemberOption[] }) {
  const { t } = useTranslation();
  const [query, setQuery] = React.useState("");
  const [memberId, setMemberId] = React.useState("");
  const [credentials, setCredentials] = React.useState<MemberCredential[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [cardValue, setCardValue] = React.useState("");
  const [vendorValue, setVendorValue] = React.useState("");
  const [qr, setQr] = React.useState<{ token: string; image: string; memberName: string } | null>(null);

  const matches = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return members.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)).slice(0, 6);
  }, [members, query]);

  const selected = members.find((m) => m.id === memberId) ?? null;

  const reload = React.useCallback(async (id: string) => {
    try {
      setCredentials(await listMemberCredentials(id));
    } catch {
      setCredentials([]);
    }
  }, []);

  React.useEffect(() => {
    setQr(null);
    if (memberId) void reload(memberId);
    else setCredentials([]);
  }, [memberId, reload]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
      if (memberId) await reload(memberId);
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : t("accessControl.failed"));
    } finally {
      setBusy(false);
    }
  };

  const issue = (type: CredentialType, value?: string) =>
    run(async () => {
      const token = await issueCredential(memberId, type, value);
      if (type === "qr" && token) {
        const image = await QRCode.toDataURL(token, { margin: 1, width: 240, errorCorrectionLevel: "M" });
        setQr({ token, image, memberName: selected?.name ?? "" });
      } else {
        toast.success(t("accessControl.credentialAdded"));
        setCardValue("");
        setVendorValue("");
      }
    });

  const printQr = () => {
    if (!qr) return;
    const w = window.open("", "_blank", "width=420,height=560");
    if (!w) return;
    const doc = w.document;
    doc.title = qr.memberName;
    const wrap = doc.createElement("div");
    wrap.style.cssText = "font-family:sans-serif;text-align:center;padding:24px";
    const h = doc.createElement("h2");
    h.textContent = qr.memberName;
    const img = doc.createElement("img");
    img.src = qr.image;
    img.width = 240;
    const p = doc.createElement("p");
    p.textContent = qr.token;
    p.style.cssText = "font-family:monospace;font-size:12px";
    wrap.append(h, img, p);
    doc.body.appendChild(wrap);
    w.focus();
    w.print();
  };

  const statusLabel = (c: MemberCredential) => t(`accessControl.credentialStatuses.${c.status}`);

  return (
    <section className="rounded-xl bg-gray-50 p-6 dark:bg-gray-800" aria-labelledby="ac-credentials">
      <div className="text-start">
        <h2 id="ac-credentials" className="text-base font-semibold text-gray-900 dark:text-white">{t("accessControl.credentialsTitle")}</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("accessControl.credentialsHint")}</p>
      </div>

      <div className="mt-4 space-y-2">
        <input
          className={inputClass}
          value={selected ? selected.name : query}
          onChange={(e) => {
            setMemberId("");
            setQuery(e.target.value);
          }}
          placeholder={t("accessControl.findMember")}
          aria-label={t("accessControl.findMember")}
        />
        {!selected && matches.length > 0 && (
          <ul className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            {matches.map((m) => (
              <li key={m.id}>
                <button type="button" onClick={() => setMemberId(m.id)} className="w-full px-3 py-2 text-start text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                  <span className="font-medium text-gray-900 dark:text-white">{m.name}</span>
                  <span className="ms-2 text-xs text-gray-500">{m.email}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <div className="mt-5 space-y-5">
          <div>
            <button type="button" disabled={busy} onClick={() => void issue("qr")} className="btn btn-primary">
              {t("accessControl.issueQr")}
            </button>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("accessControl.issueQrHint")}</p>
          </div>

          {qr && (
            <div role="status" className="rounded-xl border border-sky-200 bg-white p-4 text-center dark:border-sky-800 dark:bg-gray-900">
              <img src={qr.image} alt={t("accessControl.qrAlt", { name: qr.memberName })} width={240} height={240} className="mx-auto" />
              <p className="mt-2 font-mono text-xs text-gray-700 dark:text-gray-300" dir="ltr">{qr.token}</p>
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{t("accessControl.qrOnce")}</p>
              <button type="button" onClick={printQr} className="btn btn-secondary mt-3"><FiPrinter /> {t("accessControl.print")}</button>
            </div>
          )}

          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              void issue("badge", cardValue);
            }}
          >
            <input className={inputClass} value={cardValue} onChange={(e) => setCardValue(e.target.value)} placeholder={t("accessControl.cardPlaceholder")} aria-label={t("accessControl.cardPlaceholder")} maxLength={200} />
            <button type="submit" disabled={busy || !cardValue.trim()} className="btn btn-secondary shrink-0">{t("accessControl.assignCard")}</button>
          </form>

          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              void issue("vendor_user_id", vendorValue);
            }}
          >
            <input className={inputClass} value={vendorValue} onChange={(e) => setVendorValue(e.target.value)} placeholder={t("accessControl.vendorPlaceholder")} aria-label={t("accessControl.vendorPlaceholder")} maxLength={200} />
            <button type="submit" disabled={busy || !vendorValue.trim()} className="btn btn-secondary shrink-0">{t("accessControl.linkTerminalUser")}</button>
          </form>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t("accessControl.vendorHint")}</p>

          <ul className="divide-y divide-gray-200 text-sm dark:divide-gray-700">
            {credentials.length === 0 && <li className="py-2 text-gray-500">{t("accessControl.noCredentials")}</li>}
            {credentials.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                <span className="text-gray-800 dark:text-gray-200">
                  {t(`accessControl.credentialTypes.${c.identity_type}`)}
                  <span className="ms-2 text-xs text-gray-500">{statusLabel(c)}</span>
                  {c.last_used_at && <span className="ms-2 text-xs text-gray-500">{new Date(c.last_used_at).toLocaleDateString()}</span>}
                </span>
                {c.status === "active" && (
                  <button type="button" disabled={busy} onClick={() => void run(() => revokeCredential(c.id))} className="text-xs text-red-600 hover:underline">
                    {t("accessControl.revoke")}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
