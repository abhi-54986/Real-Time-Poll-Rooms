'use client';

import CreatePollForm from '@/components/CreatePollForm';

export default function CreatePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Create a New Poll</h1>
      <p className="text-gray-400 mb-6">
        Add your question and at least 2 options, then share the link.
      </p>
      <CreatePollForm />
    </div>
  );
}
