export function DashboardHome() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto">
      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to your Dashboard</h2>
      <p className="text-gray-500 mb-8">
        Select a workspace from the sidebar to view its projects, tasks, and team members. 
        Or create a new workspace to get started.
      </p>
    </div>
  );
}
