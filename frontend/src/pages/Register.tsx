import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Lock } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (!agree) {
      setError('Please agree to the reviewer guidelines.');
      return;
    }

    setIsRegistering(true);

    setTimeout(() => {
      alert('Account Created Successfully! (Demo Only)');
      setIsRegistering(false);

      // Optional: clear the form
      setName('');
      setEmail('');
      setPassword('');
      setAgree(false);
    }, 800);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-slate-50/50">
      <div className="max-w-md w-full bg-white border border-slate-100 rounded-3xl shadow-xl p-8 space-y-6">

        {/* Header */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex justify-center items-center w-10 h-10 rounded-xl bg-brand-600 text-white font-bold text-lg mb-3"
          >
            T
          </Link>

          <h2 className="text-2xl font-extrabold text-slate-900">
            Join TruthHubBD
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Help build a trusted community review platform.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
              Full Name
            </label>

            <div className="relative">
              <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />

              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
              Email Address
            </label>

            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />

              <input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
              Password
            </label>

            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />

              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Checkbox */}
          <div className="flex items-start gap-2">
            <input
              id="agree"
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-1 accent-brand-600"
            />

            <label htmlFor="agree" className="text-sm text-slate-600">
              I agree to the TruthHubBD Reviewer Guidelines.
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isRegistering}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition disabled:opacity-50"
          >
            {isRegistering ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Login */}
        <div className="text-center text-sm text-slate-500 border-t pt-4">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-brand-600 font-semibold hover:underline"
          >
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}
