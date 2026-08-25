"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AlertTriangle, Inbox, Loader2, LockKeyhole, LogOut, MessageSquare, RefreshCw } from "lucide-react";
import { ApiError, getFeedback, getReports } from "@/lib/api";
import type { EventReport, FeedbackSubmission } from "@/lib/types";

const TOKEN_KEY = "ps-admin-token";

type Tab = "feedback" | "reports";

const FEEDBACK_TYPE_LABELS: Record<FeedbackSubmission["type"], string> = {
  GENERAL: "Suggestion",
  BUG: "Bug",
  CONTENT: "Contenu",
};
const REPORT_TYPE_LABELS: Record<EventReport["type"], string> = {
  INCORRECT_INFORMATION: "Info incorrecte",
  EVENT_CANCELLED: "Événement annulé",
  BROKEN_LINK: "Lien cassé",
  INAPPROPRIATE_CONTENT: "Contenu inapproprié",
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
});
function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}

export function AdminFeedback() {
  const [token, setToken] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [authError, setAuthError] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const read = () => setToken(sessionStorage.getItem(TOKEN_KEY));
    read();
  }, []);

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const candidate = tokenInput.trim();
    if (!candidate) return;
    setChecking(true);
    setAuthError(false);
    try {
      await getFeedback(candidate, 0);
      sessionStorage.setItem(TOKEN_KEY, candidate);
      setToken(candidate);
      setTokenInput("");
    } catch {
      setAuthError(true);
    } finally {
      setChecking(false);
    }
  }

  function signOut() {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }

  if (!token) {
    return (
      <div className="admin-gate">
        <form className="admin-gate-card" onSubmit={authenticate}>
          <LockKeyhole size={26} />
          <h1>Espace retours</h1>
          <p>Saisissez le jeton d’accès pour consulter les retours et signalements.</p>
          <input
            type="password"
            value={tokenInput}
            onChange={(event) => setTokenInput(event.target.value)}
            placeholder="Jeton d’accès"
            autoComplete="off"
            aria-label="Jeton d’accès"
          />
          <button type="submit" disabled={checking}>
            {checking ? <Loader2 className="spin" size={17} /> : null}
            {checking ? "Vérification…" : "Accéder"}
          </button>
          {authError ? <p className="admin-gate-error" role="alert">Jeton invalide.</p> : null}
        </form>
      </div>
    );
  }

  return <AdminDashboard token={token} onSignOut={signOut} />;
}

function AdminDashboard({ token, onSignOut }: { token: string; onSignOut: () => void }) {
  const [tab, setTab] = useState<Tab>("feedback");
  return (
    <section className="admin-shell shell-pad">
      <header className="admin-head">
        <div>
          <p className="eyebrow">Paname Spot</p>
          <h1>Retours reçus</h1>
        </div>
        <button type="button" className="admin-signout" onClick={onSignOut}>
          <LogOut size={16} /> Se déconnecter
        </button>
      </header>
      <div className="admin-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "feedback"} className={tab === "feedback" ? "is-active" : ""} onClick={() => setTab("feedback")}>
          <MessageSquare size={16} /> Retours
        </button>
        <button type="button" role="tab" aria-selected={tab === "reports"} className={tab === "reports" ? "is-active" : ""} onClick={() => setTab("reports")}>
          <AlertTriangle size={16} /> Signalements
        </button>
      </div>
      {tab === "feedback" ? <FeedbackList token={token} /> : <ReportList token={token} />}
    </section>
  );
}

type LoadState = "loading" | "ready" | "error" | "unauthorized";

function useSubmissions<T>(token: string, fetcher: (token: string, page: number) => Promise<{ items: T[]; nextCursor: string | null; hasNext: boolean }>) {
  const [items, setItems] = useState<T[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Every setState here runs after `await`, so the mount effect never triggers
  // a synchronous cascade. The "loading" transitions live in the handlers below.
  const fetchPage = useCallback(async (page: number, append: boolean) => {
    try {
      const result = await fetcher(token, page);
      setItems((current) => (append ? [...current, ...result.items] : result.items));
      setNextCursor(result.hasNext ? result.nextCursor : null);
      setState("ready");
    } catch (error) {
      if (!append) setState(error instanceof ApiError && error.message.includes("401") ? "unauthorized" : "error");
    } finally {
      setLoadingMore(false);
    }
  }, [token, fetcher]);

  useEffect(() => {
    const run = () => { fetchPage(0, false); };
    run();
  }, [fetchPage]);

  const reload = () => { setState("loading"); fetchPage(0, false); };
  const loadMore = () => { if (nextCursor) { setLoadingMore(true); fetchPage(Number(nextCursor), true); } };
  return { items, state, nextCursor, loadingMore, reload, loadMore };
}

function StatusPill({ status }: { status: string }) {
  return <span className={`admin-status admin-status-${status.toLowerCase()}`}>{status}</span>;
}

function ListChrome({ state, empty, onReload, children }: { state: LoadState; empty: boolean; onReload: () => void; children: React.ReactNode }) {
  if (state === "loading") return <div className="admin-note"><Loader2 className="spin" size={20} /> Chargement…</div>;
  if (state === "unauthorized") return <div className="admin-note admin-note-error"><AlertTriangle size={20} /> Jeton invalide ou expiré. Rechargez la page pour vous reconnecter.</div>;
  if (state === "error") return <div className="admin-note admin-note-error"><AlertTriangle size={20} /> Impossible de charger les données. <button type="button" className="admin-inline-btn" onClick={onReload}><RefreshCw size={14} /> Réessayer</button></div>;
  if (empty) return <div className="admin-note"><Inbox size={20} /> Aucun élément pour le moment.</div>;
  return <>{children}</>;
}

function FeedbackList({ token }: { token: string }) {
  const { items, state, nextCursor, loadingMore, reload, loadMore } = useSubmissions<FeedbackSubmission>(token, getFeedback);
  return (
    <ListChrome state={state} empty={items.length === 0} onReload={reload}>
      <ul className="admin-list">
        {items.map((item) => (
          <li key={item.id} className="admin-card">
            <div className="admin-card-top">
              <span className="admin-tag">{FEEDBACK_TYPE_LABELS[item.type]}</span>
              <StatusPill status={item.status} />
              <time className="admin-date">{formatDate(item.createdAt)}</time>
            </div>
            <p className="admin-message">{item.message}</p>
            <div className="admin-card-foot">
              {item.email ? <a href={`mailto:${item.email}`}>{item.email}</a> : <span className="admin-muted">Sans e-mail</span>}
              {item.internalNote ? <span className="admin-note-inline">Note : {item.internalNote}</span> : null}
            </div>
          </li>
        ))}
      </ul>
      {nextCursor ? <button type="button" className="admin-more" disabled={loadingMore} onClick={loadMore}>{loadingMore ? "Chargement…" : "Charger plus"}</button> : null}
    </ListChrome>
  );
}

function ReportList({ token }: { token: string }) {
  const { items, state, nextCursor, loadingMore, reload, loadMore } = useSubmissions<EventReport>(token, getReports);
  return (
    <ListChrome state={state} empty={items.length === 0} onReload={reload}>
      <ul className="admin-list">
        {items.map((item) => (
          <li key={item.id} className="admin-card">
            <div className="admin-card-top">
              <span className="admin-tag admin-tag-alert">{REPORT_TYPE_LABELS[item.type]}</span>
              <StatusPill status={item.status} />
              <time className="admin-date">{formatDate(item.createdAt)}</time>
            </div>
            <a className="admin-event-link" href={`/events/${item.eventSlug}`} target="_blank" rel="noreferrer">{item.eventTitle}</a>
            {item.message ? <p className="admin-message">{item.message}</p> : <p className="admin-muted">Aucun message</p>}
            <div className="admin-card-foot">
              {item.email ? <a href={`mailto:${item.email}`}>{item.email}</a> : <span className="admin-muted">Sans e-mail</span>}
              {item.internalNote ? <span className="admin-note-inline">Note : {item.internalNote}</span> : null}
            </div>
          </li>
        ))}
      </ul>
      {nextCursor ? <button type="button" className="admin-more" disabled={loadingMore} onClick={loadMore}>{loadingMore ? "Chargement…" : "Charger plus"}</button> : null}
    </ListChrome>
  );
}
