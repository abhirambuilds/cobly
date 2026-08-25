import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../ui';

export function NotFound() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="aurora grid-field relative grid min-h-screen place-items-center overflow-hidden bg-canvas px-5 text-ink">
      <div className="relative z-10 flex max-w-md flex-col items-center text-center">
        <Link
          to="/"
          className="mb-10 inline-flex items-center gap-2.5 text-muted transition-colors hover:text-ink"
        >
          <img src="/favicon.svg" alt="" width={26} height={26} className="rounded-lg" />
          <span className="font-display text-base font-semibold">Cobly</span>
        </Link>

        <p className="signal-text font-display text-7xl font-semibold tracking-tight">404</p>
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          The page you’re looking for doesn’t exist or may have moved.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/">
            <Button variant={isAuthenticated ? 'secondary' : 'primary'} leftIcon="home">
              Back home
            </Button>
          </Link>
          {isAuthenticated && (
            <Link to="/dashboard">
              <Button rightIcon="arrow-right">Go to dashboard</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
