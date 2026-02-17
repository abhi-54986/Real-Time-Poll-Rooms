'use client';

import CreatePollForm from '@/components/CreatePollForm';

export default function CreatePage() {
  return (
    <div className="max-w-xl mx-auto animate-slide-up">
      {/* Header */}
      <div className="mb-8">
        <div className="badge bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 mb-4">
          New Poll
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
          Create your poll
        </h1>
        <p className="text-gray-500 leading-relaxed">
          Write your question, add options, and share the link instantly.
        </p>
      </div>

      {/* Form Card */}
      <div className="glass-card p-6 sm:p-8">
        <CreatePollForm />
      </div>
    </div>
  );
}
