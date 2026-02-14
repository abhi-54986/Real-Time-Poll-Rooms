import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h1 className="text-4xl font-bold mb-4">Poll Not Found</h1>
      <p className="text-gray-400 mb-6 max-w-md">
        This poll doesn&apos;t exist or may have been removed. Check the link
        and try again.
      </p>
      <Link
        href="/create"
        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold hover:from-purple-500 hover:to-pink-500 transition-all duration-200"
      >
        Create a New Poll
      </Link>
    </div>
  );
}
