import { Link } from 'react-router-dom';

export function Landing() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
        Collaborate seamlessly with <span className="text-blue-600">Cobly</span>
      </h1>
      <p className="text-xl text-gray-600 max-w-2xl mb-8">
        The unified workspace for your projects, tasks, meetings, and team discussions.
      </p>
      <div className="flex gap-4">
        <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg shadow-sm transition-colors">
          Get Started
        </Link>
        <Link to="/login" className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium py-3 px-6 rounded-lg shadow-sm transition-colors">
          Sign In
        </Link>
      </div>
    </div>
  );
}
