import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center animate-fade-in">
      {/* Hero badge */}
      <div className="badge bg-violet-500/10 text-violet-400 border border-violet-500/20 mb-6">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-400" />
        </span>
        Live &amp; Real-Time
      </div>

      {/* Heading */}
      <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
        <span className="block text-white">Create Polls.</span>
        <span className="block gradient-text">Get Results Live.</span>
      </h1>

      {/* Subtext */}
      <p className="text-lg text-gray-400 mb-10 max-w-lg leading-relaxed">
        Launch a poll in seconds, share the link, and watch votes come in 
        real-time. No sign-up required.
      </p>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/create" className="btn-primary text-lg px-8 py-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Create a Poll
        </Link>
      </div>

      {/* Features grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-20 w-full max-w-2xl">
        {[
          { icon: '⚡', title: 'Instant', desc: 'Results update in real-time' },
          { icon: '🔗', title: 'Shareable', desc: 'One link, anyone can vote' },
          { icon: '🛡️', title: 'Fair', desc: 'Anti-abuse protection built-in' },
        ].map((feature) => (
          <div key={feature.title} className="glass-card p-5 text-center">
            <div className="text-2xl mb-2">{feature.icon}</div>
            <h3 className="font-semibold text-white text-sm mb-1">{feature.title}</h3>
            <p className="text-xs text-gray-500">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
