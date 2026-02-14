import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        Real-Time Poll Rooms
      </h1>
      <p className="text-lg text-gray-300 mb-8 max-w-md">
        Create a poll, share the link, and watch votes come in live. No sign-up
        required.
      </p>
      <Link
        href="/create"
        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-lg hover:from-purple-500 hover:to-pink-500 transition-all duration-200 shadow-lg hover:shadow-purple-500/25 hover:scale-105"
      >
        Create a Poll
      </Link>
    </div>
  );
}
