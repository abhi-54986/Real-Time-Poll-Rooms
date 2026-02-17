import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
      <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-gray-600">
          <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Poll not found</h1>
      <p className="text-gray-500 mb-8 max-w-sm">
        This poll doesn&apos;t exist or may have been removed. Double-check the link and try again.
      </p>
      <Link href="/create" className="btn-primary">
        Create a New Poll
      </Link>
    </div>
  );
}
