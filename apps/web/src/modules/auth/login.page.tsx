import { useState } from 'react';

export function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-md p-6">
        <h1 className="text-2xl font-semibold">Login</h1>

        <form className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Phone</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2"
              onChange={(e) => setPhone(e.target.value)}
              placeholder="090..."
              value={phone}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2"
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              value={password}
            />
          </div>

          <button
            className="w-full rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
            disabled
            type="button"
          >
            Coming soon
          </button>
        </form>
      </div>
    </div>
  );
}
