import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import type { FormEvent } from 'react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Button, Field, Input, useToast } from '../ui';
import { AuthShell, AuthError, PasswordInput } from './AuthShell';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await api.post('/auth/register', { name, email, password });
      toast.success('Your account is ready — please sign in.', 'Account created');
      navigate('/login');
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : 'Unknown error') || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start collaborating with your team in minutes."
      altPrompt="Already have an account?"
      altLabel="Sign in"
      altTo="/login"
    >
      <AuthError message={error} />
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field htmlFor="register-name" label="Full name">
          <Input
            id="register-name"
            type="text"
            autoComplete="name"
            required
            autoFocus
            placeholder="Ada Lovelace"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
          />
        </Field>
        <Field htmlFor="register-email" label="Email">
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </Field>
        <Field
          htmlFor="register-password"
          label="Password"
          hint="Use at least 6 characters."
        >
          <PasswordInput
            id="register-password"
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </Field>
        <Button type="submit" fullWidth size="lg" loading={isLoading} className="mt-1">
          {isLoading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthShell>
  );
}
