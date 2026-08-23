import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function MainLayout() {
  const { isAuthenticated, user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-blue-600">Cobly</Link>
          <nav className="flex gap-4 items-center">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">Dashboard</Link>
                <span className="text-sm text-gray-400">|</span>
                <span className="text-sm text-gray-500">{user?.name}</span>
                <button onClick={logout} className="text-sm text-red-600 hover:text-red-800 font-medium ml-4">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">Login</Link>
                <Link to="/register" className="text-gray-600 hover:text-gray-900 font-medium">Register</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
