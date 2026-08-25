import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">404</p>
      <h1 className="mt-2 text-3xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-3 max-w-md text-gray-600">
        The page you&rsquo;re looking for doesn&rsquo;t exist or may have been moved.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          to="/"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
        >
          Go home
        </Link>
        <Link
          to="/dashboard"
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium transition-colors border border-gray-300"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
