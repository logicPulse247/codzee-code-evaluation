'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto py-16 px-4 font-sans text-slate-900">
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold font-serif text-slate-900 tracking-tight">
            InterviewKit
          </h1>
          <p className="text-xs font-mono text-slate-500">
            Prepare smarter. Interview with confidence.
          </p>
        </div>

        <ErrorAlert message={error} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="user@example.com"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isSubmitting}
            className="w-full"
          >
            Sign In
          </Button>
        </form>

        <div className="pt-2 text-center text-xs font-mono text-slate-500 border-t border-slate-200">
          <span>Don't have an account? </span>
          <Link href="/register" className="font-semibold text-blue-600 hover:underline">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
