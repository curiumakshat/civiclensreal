import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import exifr from "exifr";
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Camera,
  CheckCircle2,
  FileText,
  ImagePlus,
  LogOut,
  MapPin,
  Menu,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
  UserPlus,
  X,
} from "lucide-react";
import "./styles.css";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || "",
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
);
const LOGO = "/civiclens-logo.png";

function App() {
  const [session, setSession] = useState(null),
    [profile, setProfile] = useState(null),
    [loading, setLoading] = useState(true),
    [view, setView] = useState("dashboard"),
    [mobileNav, setMobileNav] = useState(false),
    [notice, setNotice] = useState("");
  const loadProfile = async (currentSession) => {
    setSession(currentSession);
    if (!currentSession) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("id,display_name,role")
      .eq("id", currentSession.user.id)
      .maybeSingle();
    const role = data?.role || currentSession.user.app_metadata?.role || "user";
    setProfile(
      data || {
        id: currentSession.user.id,
        display_name: currentSession.user.email?.split("@")[0],
        role,
      },
    );
    setLoading(false);
  };
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => loadProfile(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) =>
      loadProfile(next),
    );
    return () => listener.subscription.unsubscribe();
  }, []);
  const signOut = async () => {
    await supabase.auth.signOut();
    setView("dashboard");
  };
  if (loading)
    return (
      <div className="loading-screen">
        <img src={LOGO} alt="CivicLens" />
        <span>Connecting to CivicLens…</span>
      </div>
    );
  if (!session) return <AuthPage />;
  const isAdmin = profile?.role === "admin";
  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setView("dashboard")}>
          <img src={LOGO} alt="CivicLens" />
        </button>
        <nav className={mobileNav ? "nav-links open" : "nav-links"}>
          <button
            className={view === "dashboard" ? "active" : ""}
            onClick={() => {
              setView("dashboard");
              setMobileNav(false);
            }}
          >
            {isAdmin ? "Admin analytics" : "My reports"}
          </button>
          {!isAdmin && (
            <button
              className={view === "report" ? "active" : ""}
              onClick={() => {
                setView("report");
                setMobileNav(false);
              }}
            >
              Report an issue
            </button>
          )}
          {isAdmin && (
            <button
              className={view === "tracker" ? "active" : ""}
              onClick={() => {
                setView("tracker");
                setMobileNav(false);
              }}
            >
              Issue tracker
            </button>
          )}
        </nav>
        <div className="header-actions">
          <span className="account-label">
            {profile?.display_name || session.user.email}
          </span>
          <button className="logout-btn" onClick={signOut}>
            <LogOut size={16} /> Sign out
          </button>
          <button className="menu-btn" onClick={() => setMobileNav(!mobileNav)}>
            <Menu size={21} />
          </button>
        </div>
      </header>
      {notice && (
        <div className="notice">
          <CheckCircle2 size={16} />
          {notice}
          <button onClick={() => setNotice("")}>
            <X size={14} />
          </button>
        </div>
      )}
      {isAdmin && view === "dashboard" && <AdminDashboard />}
      {isAdmin && view === "tracker" && <AdminTracker />}
      {!isAdmin && view === "dashboard" && (
        <UserDashboard onReport={() => setView("report")} />
      )}
      {!isAdmin && view === "report" && (
        <ReportForm
          session={session}
          onDone={(message) => {
            setNotice(message);
            setView("dashboard");
          }}
        />
      )}
      <footer>
        <div className="footer-brand">CivicLens</div>
        <span>Real reports. Real progress.</span>
        <span>© 2026 CivicLens</span>
      </footer>
    </div>
  );
}

function AuthPage() {
  const [mode, setMode] = useState("signin"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    const result =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (result.error) setError(result.error.message);
    else if (mode === "signup" && !result.data.session)
      setMessage("Check your email to confirm your account, then sign in.");
  };
  return (
    <main className="auth-page">
      <div className="auth-card">
        <img
          className="auth-logo"
          src={LOGO}
          alt="CivicLens — focus on public solutions"
        />
        <div className="eyebrow">
          <ShieldCheck size={14} /> SECURE CIVIC REPORTING
        </div>
        <h1>{mode === "signin" ? "Welcome back." : "Join CivicLens."}</h1>
        <p>
          {mode === "signin"
            ? "Sign in to report an issue and track the real status of your submissions."
            : "Create an account to make and follow real community reports."}
        </p>
        <form onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              minLength="6"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </label>
          {error && (
            <div className="form-error">
              <AlertCircle size={15} />
              {error}
            </div>
          )}
          {message && (
            <div className="form-success">
              <CheckCircle2 size={15} />
              {message}
            </div>
          )}
          <button className="primary auth-submit" disabled={busy}>
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Register"}{" "}
            <ArrowUpRight size={16} />
          </button>
        </form>
        <button
          className="switch-auth"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError("");
            setMessage("");
          }}
        >
          {mode === "signin" ? (
            <>
              <UserPlus size={15} /> Register a new account
            </>
          ) : (
            "Already registered? Sign in"
          )}
        </button>
      </div>
    </main>
  );
}

function UserDashboard({ onReport }) {
  const [reports, setReports] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const fetchReports = async () => {
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (queryError) setError(queryError.message);
    else setReports(data || []);
    setLoading(false);
  };
  useEffect(() => {
    fetchReports();
  }, []);
  const counts = useMemo(
    () => ({
      total: reports.length,
      open: reports.filter((r) => r.status !== "Resolved").length,
      resolved: reports.filter((r) => r.status === "Resolved").length,
    }),
    [reports],
  );
  return (
    <main className="dashboard-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <FileText size={14} /> RESIDENT DASHBOARD
          </div>
          <h1>
            Your reports, <em>in focus.</em>
          </h1>
          <p>
            Track every report you have submitted and see when its status
            changes.
          </p>
        </div>
        <button className="primary" onClick={onReport}>
          Report an issue <ArrowUpRight size={17} />
        </button>
      </div>
      <div className="metric-row">
        <Metric value={counts.total} label="Reports submitted" />
        <Metric value={counts.open} label="Still in progress" />
        <Metric value={counts.resolved} label="Resolved" />
      </div>
      <section className="data-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">YOUR ACTIVITY</div>
            <h2>Report tracker</h2>
          </div>
          <button className="refresh-btn" onClick={fetchReports}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
        {error && <div className="form-error">{error}</div>}
        {loading ? (
          <LoadingRows />
        ) : reports.length === 0 ? (
          <EmptyState onReport={onReport} />
        ) : (
          <div className="report-table">
            {reports.map((report) => (
              <ReportRow key={report.id} report={report} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function AdminDashboard() {
  const [reports, setReports] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const fetchReports = async () => {
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (queryError) setError(queryError.message);
    else setReports(data || []);
    setLoading(false);
  };
  useEffect(() => {
    fetchReports();
    const channel = supabase
      .channel("admin-report-alerts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        fetchReports,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  const resolved = reports.filter((r) => r.status === "Resolved").length,
    active = reports.length - resolved,
    highPriority = reports.filter(
      (r) =>
        ["High", "Critical"].includes(r.priority) && r.status !== "Resolved",
    ),
    rate = reports.length ? Math.round((resolved / reports.length) * 100) : 0,
    categoryCounts = Object.entries(
      reports.reduce((a, r) => {
        a[r.category] = (a[r.category] || 0) + 1;
        return a;
      }, {}),
    ).sort((a, b) => b[1] - a[1]);
  return (
    <main className="dashboard-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <BarChart3 size={14} /> ADMIN CONSOLE
          </div>
          <h1>
            Community <em>signal.</em>
          </h1>
          <p>
            Live analytics and issue management from your Supabase database.
          </p>
        </div>
        <button className="refresh-btn" onClick={fetchReports}>
          <RefreshCw size={15} /> Refresh data
        </button>
      </div>
      {error && <div className="form-error">{error}</div>}
      {loading ? (
        <LoadingRows />
      ) : (
        <>
          <div className="metric-row admin-metrics">
            <Metric value={reports.length} label="Total reports" />
            <Metric value={active} label="Active issues" />
            <Metric value={resolved} label="Resolved" />
            <Metric value={`${rate}%`} label="Resolution rate" />
          </div>
          <section className="alert-panel">
            <div>
              <div className="eyebrow">WARD ALERTS</div>
              <h2>Priority issues in your locality</h2>
              <p>
                {highPriority.length
                  ? `${highPriority.length} high-priority issue${highPriority.length === 1 ? "" : "s"} need attention.`
                  : "No unresolved high-priority issues right now."}
              </p>
            </div>
            <div className="alert-count">{highPriority.length}</div>
          </section>
          <div className="analytics-grid">
            <section className="analytics-card">
              <div className="card-title">
                <span>Reports by category</span>
                <small>LIVE DATA</small>
              </div>
              {categoryCounts.length === 0 ? (
                <p className="empty-copy">
                  No reports have been submitted yet.
                </p>
              ) : (
                categoryCounts.map(([category, count]) => (
                  <div className="bar-row" key={category}>
                    <span>{category}</span>
                    <div>
                      <i
                        style={{
                          width: `${Math.max(8, (count / Math.max(...categoryCounts.map((x) => x[1]))) * 100)}%`,
                        }}
                      ></i>
                    </div>
                    <b>{count}</b>
                  </div>
                ))
              )}
            </section>
            <section className="analytics-card">
              <div className="card-title">
                <span>Status overview</span>
                <small>LIVE DATA</small>
              </div>
              <div className="status-ring">
                <div>
                  <strong>{rate}%</strong>
                  <span>resolved</span>
                </div>
              </div>
              <div className="legend">
                <span>
                  <i className="dot blue"></i>Submitted{" "}
                  <b>
                    {reports.filter((r) => r.status === "Submitted").length}
                  </b>
                </span>
                <span>
                  <i className="dot amber"></i>In progress{" "}
                  <b>
                    {reports.filter((r) => r.status === "In progress").length}
                  </b>
                </span>
                <span>
                  <i className="dot green"></i>Resolved <b>{resolved}</b>
                </span>
              </div>
            </section>
          </div>
        </>
      )}
    </main>
  );
}

function AdminTracker() {
  const [reports, setReports] = useState([]),
    [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    setReports(
      (data || []).sort(
        (a, b) =>
          (({ Critical: 0, High: 1, Medium: 2, Low: 3 })[a.priority] ?? 4) -
          ({ Critical: 0, High: 1, Medium: 2, Low: 3 }[b.priority] ?? 4),
      ),
    );
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);
  const update = async (id, field, value) => {
    const { error } = await supabase
      .from("reports")
      .update({ [field]: value })
      .eq("id", id);
    if (!error)
      setReports((items) =>
        items.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
      );
  };
  return (
    <main className="dashboard-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <MapPin size={14} /> ADMIN TRACKER
          </div>
          <h1>
            Manage <em>every issue.</em>
          </h1>
          <p>
            Unresolved priority issues are listed first so ward action is
            visible.
          </p>
        </div>
        <button className="refresh-btn" onClick={load}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>
      {loading ? (
        <LoadingRows />
      ) : reports.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="admin-list">
          {reports.map((r) => (
            <div
              className={
                "admin-row priority-" + (r.priority || "Medium").toLowerCase()
              }
              key={r.id}
            >
              <div className="admin-row-copy">
                <span
                  className={
                    "priority-badge " + (r.priority || "Medium").toLowerCase()
                  }
                >
                  {r.priority || "Medium"} priority
                </span>
                <span className="report-id">{r.reference_code}</span>
                <h3>{r.brief_reason || r.category}</h3>
                <p>
                  {r.category} · {r.ward || "Ward not provided"} ·{" "}
                  {r.neighborhood || "Locality not provided"} ·{" "}
                  {new Date(r.created_at).toLocaleString()}
                </p>
                {r.reason && <small>{r.reason}</small>}
              </div>
              {r.photo_url && (
                <img
                  className="row-thumb"
                  src={r.photo_url}
                  alt="Uploaded issue"
                />
              )}
              <div className="tracker-controls">
                <label>
                  Priority
                  <select
                    value={r.priority || "Medium"}
                    onChange={(e) => update(r.id, "priority", e.target.value)}
                  >
                    <option>Critical</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </label>
                <label>
                  Status
                  <select
                    value={r.status}
                    onChange={(e) => update(r.id, "status", e.target.value)}
                  >
                    <option>Submitted</option>
                    <option>In progress</option>
                    <option>Resolved</option>
                  </select>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function ReportForm({ session, onDone }) {
  const [form, setForm] = useState({
      category: "Roads & sidewalks",
      reason: "",
      brief_reason: "",
      ward: "",
      neighborhood: "",
    }),
    [photo, setPhoto] = useState(null),
    [exif, setExif] = useState(null),
    [preview, setPreview] = useState(""),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  const setField = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const choosePhoto = async (file) => {
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
    try {
      setExif(await exifr.parse(file, { gps: true, tiff: true, exif: true }));
    } catch {
      setExif(null);
    }
  };
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    let photo_url = null;
    if (photo) {
      const path = `${session.user.id}/${crypto.randomUUID()}-${photo.name.replace(/[^a-z0-9.]/gi, "-")}`;
      const upload = await supabase.storage
        .from("civic-report-images")
        .upload(path, photo, { contentType: photo.type, upsert: false });
      if (upload.error) {
        setError(`Photo upload failed: ${upload.error.message}`);
        setSaving(false);
        return;
      }
      photo_url = supabase.storage.from("civic-report-images").getPublicUrl(path)
        .data.publicUrl;
    }
    const { error: insertError } = await supabase
      .from("reports")
      .insert({
        user_id: session.user.id,
        category: form.category,
        reason: form.reason,
        brief_reason: form.brief_reason,
        description: form.reason,
        ward: form.ward,
        neighborhood: form.neighborhood,
        photo_url,
        photo_exif: exif || null,
      });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    onDone("Your report was submitted and saved to CivicLens.");
  };
  return (
    <main className="form-page">
      <div className="form-intro">
        <div className="eyebrow">
          <Camera size={14} /> NEW REPORT
        </div>
        <h1>
          Help your city
          <br />
          <em>see clearly.</em>
        </h1>
        <p>
          Submit a real issue with enough context for the local team to act. You
          can track its status from your dashboard.
        </p>
        <div className="privacy-card">
          <ShieldCheck size={18} />
          <span>
            <b>Your report is protected.</b>
            <br />
            Your account details are never displayed publicly.
          </span>
        </div>
      </div>
      <form className="report-form" onSubmit={submit}>
        <div className="form-section-title">Issue details</div>
        <label>
          Category <span>*</span>
          <select
            required
            value={form.category}
            onChange={(e) => setField("category", e.target.value)}
          >
            <option>Roads & sidewalks</option>
            <option>Waste management</option>
            <option>Public lighting</option>
            <option>Parks & public spaces</option>
            <option>Water & drainage</option>
            <option>Safety</option>
            <option>Other</option>
          </select>
        </label>
        <label>
          Reason for reporting <span>*</span>
          <textarea
            required
            placeholder="Explain the issue, where it is, and how it affects the community."
            value={form.reason}
            onChange={(e) => setField("reason", e.target.value)}
          />
        </label>
        <label>
          Brief reason <span>*</span>
          <input
            required
            placeholder="A short summary for the tracker"
            value={form.brief_reason}
            onChange={(e) => setField("brief_reason", e.target.value)}
          />
        </label>
        <div className="two-col">
          <label>
            Ward{" "}
            <input
              placeholder="e.g. Ward 12"
              value={form.ward}
              onChange={(e) => setField("ward", e.target.value)}
            />
          </label>
          <label>
            Locality{" "}
            <input
              placeholder="e.g. Riverside"
              value={form.neighborhood}
              onChange={(e) => setField("neighborhood", e.target.value)}
            />
          </label>
        </div>
        <div className="form-section-title photo-title">Photo evidence</div>
        <label className="upload-box">
          <UploadCloud size={22} />
          <span>
            <b>{photo ? photo.name : "Upload an issue photo"}</b>
            <small>
              {photo
                ? exif
                  ? "EXIF metadata detected and will be stored"
                  : "Image selected; no EXIF metadata detected"
                : "JPG, PNG or HEIC · optional but recommended"}
            </small>
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/heic,image/webp"
            onChange={(e) =>
              e.target.files?.[0] && choosePhoto(e.target.files[0])
            }
          />
          <ImagePlus size={18} />
        </label>
        {preview && (
          <div className="photo-preview">
            <img src={preview} alt="Selected issue" />
            <div>
              <b>Photo ready</b>
              <span>
                {exif?.DateTimeOriginal
                  ? `Taken ${new Date(exif.DateTimeOriginal).toLocaleString()}`
                  : "No capture date in EXIF"}
              </span>
              {exif?.latitude && <span>GPS coordinates detected</span>}
            </div>
          </div>
        )}
        <div className="form-note">
          <ShieldCheck size={17} />
          <span>
            EXIF data helps verify when and where a photo was taken. It is
            stored with this report.
          </span>
        </div>
        {error && (
          <div className="form-error">
            <AlertCircle size={15} />
            {error}
          </div>
        )}
        <button className="primary submit-btn" disabled={saving}>
          {saving ? "Saving to CivicLens…" : "Submit real report"}{" "}
          <ArrowUpRight size={17} />
        </button>
      </form>
    </main>
  );
}

function ReportRow({ report }) {
  const statusClass =
    report.status === "Resolved"
      ? "green"
      : report.status === "In progress"
        ? "amber"
        : "blue";
  return (
    <article className="report-row">
      <div className="row-main">
        <span className={"status " + statusClass}>
          <i></i>
          {report.status}
        </span>
        <span className="priority-badge">
          {report.priority || "Medium"} priority
        </span>
        <span className="report-id">{report.reference_code}</span>
        <h3>{report.brief_reason || report.category}</h3>
        <p>
          {report.category} · {report.ward || "Ward not provided"} ·{" "}
          {report.neighborhood || "Locality not provided"} ·{" "}
          {new Date(report.created_at).toLocaleDateString()}
        </p>
        <small>{report.reason}</small>
      </div>
      {report.photo_url && (
        <img
          className="row-thumb"
          src={report.photo_url}
          alt="Report evidence"
        />
      )}
    </article>
  );
}
function Metric({ value, label }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
function LoadingRows() {
  return (
    <div className="loading-rows">
      <span></span>
      <span></span>
      <span></span>
    </div>
  );
}
function EmptyState({ onReport }) {
  return (
    <div className="empty-state">
      <FileText size={24} />
      <h3>No reports yet</h3>
      <p>
        Your real submissions will appear here after you file your first issue.
      </p>
      {onReport && (
        <button className="primary" onClick={onReport}>
          Submit your first report
        </button>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
