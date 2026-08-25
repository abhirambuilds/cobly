import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import type { FormEvent } from 'react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Button, Field, Input } from '../ui';
import { AuthShell, AuthError, PasswordInput } from './AuthShell';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const data = await api.post('/auth/login', { email, password });
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : 'Unknown error') || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your Cobly workspace."
      altPrompt="New to Cobly?"
      altLabel="Create an account"
      altTo="/register"
    >
      <AuthError message={error} />
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field htmlFor="login-email" label="Email">
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            autoFocus
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </Field>
        <Field htmlFor="login-password" label="Password">
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            required
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </Field>
        <Button type="submit" fullWidth size="lg" loading={isLoading} className="mt-1">
          {isLoading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className="mt-6 text-center text-[12.5px] text-faint">
        By continuing you agree to keep your team’s data secure.{' '}
        <Link to="/" className="text-muted underline-offset-2 hover:text-ink hover:underline">
          Back home
        </Link>
      </p>
    </AuthShell>
  );
}
