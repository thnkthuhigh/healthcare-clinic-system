import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-3xl font-semibold">Clinic System</h1>
        <p className="mt-2 text-sm text-slate-600">
          Monorepo scaffold. Start building features in <code>src/modules</code>.
        </p>

        <div className="mt-6 flex gap-3">
          <Link className="rounded bg-slate-900 px-4 py-2 text-white" to="/login">
            Login
          </Link>
          <a
            className="rounded border border-slate-300 bg-white px-4 py-2"
            href="http://localhost:4000/api/v1/health"
            rel="noreferrer"
            target="_blank"
          >
            API Health
          </a>
        </div>
      </div>
    </div>
  );
}
