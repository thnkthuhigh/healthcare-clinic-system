import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-slate-900">404</h1>
        <p className="mt-4 text-2xl font-semibold text-slate-700">Page Not Found</p>
        <p className="mt-2 text-slate-600">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            to="/"
            className="rounded bg-slate-900 px-6 py-3 text-white hover:bg-slate-800 transition-colors"
          >
            Go Home
          </Link>
          <Link
            to="/login"
            className="rounded border border-slate-300 bg-white px-6 py-3 text-slate-900 hover:bg-slate-50 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
