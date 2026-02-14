'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { initSocket } from '@/lib/socket';
import { v4 as uuidv4 } from 'uuid';
import type { Socket } from 'socket.io-client';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface PollData {
  id: string;
  question: string;
  createdAt: string;
  options: PollOption[];
}

/* ------------------------------------------------------------------ */
/*  localStorage helpers                                               */
/* ------------------------------------------------------------------ */

const VOTER_TOKEN_KEY = 'poll_voter_token';
const VOTED_POLLS_KEY = 'poll_voted_polls';

function getVoterToken(): string {
  if (typeof window === 'undefined') return '';
  let token = localStorage.getItem(VOTER_TOKEN_KEY);
  if (!token) {
    token = uuidv4();
    localStorage.setItem(VOTER_TOKEN_KEY, token);
  }
  return token;
}

function getVotedOptionId(pollId: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const voted = JSON.parse(localStorage.getItem(VOTED_POLLS_KEY) || '{}');
    return voted[pollId] ?? null;
  } catch {
    return null;
  }
}

function markVotedLocally(pollId: string, optionId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const voted = JSON.parse(localStorage.getItem(VOTED_POLLS_KEY) || '{}');
    voted[pollId] = optionId;
    localStorage.setItem(VOTED_POLLS_KEY, JSON.stringify(voted));
  } catch {
    // Ignore localStorage errors (e.g. private browsing quota)
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PollView({ poll }: { poll: PollData }) {
  const [options, setOptions] = useState<PollOption[]>(poll.options);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [voting, setVoting] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const debounceRef = useRef(false);

  const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0);

  /* ---- Initialise share URL + check local vote status ------------- */
  useEffect(() => {
    setShareUrl(window.location.href);

    const localVoted = getVotedOptionId(poll.id);
    if (localVoted) {
      setHasVoted(true);
      setVotedOptionId(localVoted);
    }
  }, [poll.id]);

  /* ---- Socket.io real-time connection ----------------------------- */
  useEffect(() => {
    let mounted = true;
    let socketInstance: Socket | null = null;

    const setup = () => {
      try {
        socketInstance = initSocket();

        socketInstance.emit('join-poll', poll.id);

        socketInstance.on(
          'vote-update',
          (data: { pollId: string; results: PollOption[] }) => {
            if (data.pollId === poll.id && mounted) {
              setOptions(data.results);
            }
          }
        );

        socketInstance.on('connect', () => {
          if (mounted) setSocketConnected(true);
          socketInstance?.emit('join-poll', poll.id);
        });

        socketInstance.on('disconnect', () => {
          if (mounted) setSocketConnected(false);
        });

        if (socketInstance.connected && mounted) {
          setSocketConnected(true);
        }
      } catch (err) {
        console.error('Socket setup error:', err);
      }
    };

    setup();

    return () => {
      mounted = false;
      if (socketInstance) {
        socketInstance.emit('leave-poll', poll.id);
        socketInstance.off('vote-update');
        socketInstance.off('connect');
        socketInstance.off('disconnect');
      }
    };
  }, [poll.id]);

  /* ---- Polling fallback (when socket is not connected) ------------ */
  useEffect(() => {
    if (socketConnected) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/poll/${poll.id}`);
        if (res.ok) {
          const data = await res.json();
          setOptions(data.options);
        }
      } catch {
        // Silently fail — will retry on next interval
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [poll.id, socketConnected]);

  /* ---- Vote handler ----------------------------------------------- */
  const handleVote = useCallback(
    async (optionId: string) => {
      if (hasVoted || voting || debounceRef.current) return;

      debounceRef.current = true;
      setVoting(true);
      setError('');

      try {
        const voterToken = getVoterToken();

        const res = await fetch('/api/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pollId: poll.id, optionId, voterToken }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (res.status === 409) {
            // Already voted — sync local state
            markVotedLocally(poll.id, optionId);
            setHasVoted(true);
          }
          setError(data.error || 'Failed to cast vote.');
          return;
        }

        // Success
        markVotedLocally(poll.id, optionId);
        setHasVoted(true);
        setVotedOptionId(optionId);
        setOptions(data.results);
      } catch {
        setError('Network error. Please try again.');
      } finally {
        setVoting(false);
        setTimeout(() => {
          debounceRef.current = false;
        }, 1000);
      }
    },
    [hasVoted, voting, poll.id]
  );

  /* ---- Copy share link -------------------------------------------- */
  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  /* ---- Render ----------------------------------------------------- */
  return (
    <div className="max-w-2xl mx-auto">
      {/* Share link bar */}
      <div className="mb-6 bg-white/5 border border-white/10 rounded-lg p-4">
        <p className="text-sm text-gray-400 mb-2">Share this poll:</p>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-gray-300 truncate"
          />
          <button
            onClick={copyShareLink}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            {copied ? '✓ Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* Question */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{poll.question}</h1>
        <p className="text-gray-400 mt-2">
          {totalVotes} vote{totalVotes !== 1 ? 's' : ''} total
          {!hasVoted && ' · Select an option to vote'}
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Options / Results */}
      <div className="space-y-3">
        {options.map((option) => {
          const percentage =
            totalVotes > 0
              ? Math.round((option.votes / totalVotes) * 100)
              : 0;
          const isSelected = votedOptionId === option.id;

          return (
            <div key={option.id}>
              {hasVoted ? (
                /* ---------- Results view ---------- */
                <div
                  className={`relative overflow-hidden rounded-lg border transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  {/* progress bar */}
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-pink-600/30 transition-all duration-700 ease-out"
                    style={{ width: `${percentage}%` }}
                  />
                  <div className="relative flex items-center justify-between px-4 py-3">
                    <span className="font-medium">
                      {isSelected && '✓ '}
                      {option.text}
                    </span>
                    <span className="text-sm text-gray-300 ml-4 whitespace-nowrap">
                      {option.votes} ({percentage}%)
                    </span>
                  </div>
                </div>
              ) : (
                /* ---------- Voting view ---------- */
                <button
                  onClick={() => handleVote(option.id)}
                  disabled={voting}
                  className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-purple-500/50 rounded-lg text-left font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {option.text}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Live indicator */}
      <div className="mt-8 flex items-center gap-2 text-sm text-gray-500">
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              socketConnected ? 'bg-green-400' : 'bg-yellow-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              socketConnected ? 'bg-green-500' : 'bg-yellow-500'
            }`}
          />
        </span>
        {socketConnected
          ? 'Connected · Results update in real-time'
          : 'Polling · Results refresh every few seconds'}
      </div>
    </div>
  );
}
