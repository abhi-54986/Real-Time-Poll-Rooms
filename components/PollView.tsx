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
    <div className="max-w-2xl mx-auto animate-slide-up">
      {/* Share bar */}
      <div className="glass-card p-4 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-violet-400">
            <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
            <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
          </svg>
          <span className="text-sm font-medium text-gray-400">Share this poll</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-gray-400 truncate font-mono"
          />
          <button
            onClick={copyShareLink}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              copied
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20'
            }`}
          >
            {copied ? (
              <span className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
                Copied
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                  <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                </svg>
                Copy
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Poll Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-3">
          {poll.question}
        </h1>
        <div className="flex items-center gap-3">
          <span className="badge bg-white/[0.06] text-gray-400 border border-white/[0.08]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A6.483 6.483 0 0010 16.5a6.483 6.483 0 004.793-2.11A5.99 5.99 0 0010 12z" />
            </svg>
            {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
          </span>
          {!hasVoted && (
            <span className="text-sm text-gray-500">
              Select an option to vote
            </span>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl animate-scale-in">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-400 shrink-0 mt-0.5">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Options */}
      <div className="space-y-3">
        {options.map((option, index) => {
          const percentage =
            totalVotes > 0
              ? Math.round((option.votes / totalVotes) * 100)
              : 0;
          const isSelected = votedOptionId === option.id;
          const isLeading =
            hasVoted &&
            option.votes > 0 &&
            option.votes === Math.max(...options.map((o) => o.votes));

          return (
            <div
              key={option.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              {hasVoted ? (
                /* ---------- Results ---------- */
                <div
                  className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${
                    isSelected
                      ? 'border-violet-500/40 bg-violet-500/[0.08] shadow-lg shadow-violet-500/5'
                      : 'border-white/[0.06] bg-white/[0.02]'
                  }`}
                >
                  {/* Progress bar */}
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-1000 ease-out ${
                      isLeading
                        ? 'bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20'
                        : 'bg-white/[0.04]'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                  <div className="relative flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {isSelected && (
                        <div className="shrink-0 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-white">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      <span className={`font-medium truncate ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                        {option.text}
                      </span>
                      {isLeading && (
                        <span className="badge bg-violet-500/15 text-violet-400 border border-violet-500/20 text-[10px]">
                          Leading
                        </span>
                      )}
                    </div>
                    <span className={`text-sm font-semibold ml-4 tabular-nums whitespace-nowrap ${
                      isSelected ? 'text-violet-400' : 'text-gray-500'
                    }`}>
                      {percentage}%
                    </span>
                  </div>
                </div>
              ) : (
                /* ---------- Voting ---------- */
                <button
                  onClick={() => handleVote(option.id)}
                  disabled={voting}
                  className="w-full group glass-card-hover px-5 py-4 text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 w-5 h-5 rounded-full border-2 border-white/20 group-hover:border-violet-500/60 transition-colors" />
                    <span className="font-medium text-gray-300 group-hover:text-white transition-colors">
                      {option.text}
                    </span>
                  </div>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Status bar */}
      <div className="mt-8 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                socketConnected ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                socketConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </span>
          {socketConnected ? 'Live' : 'Polling'}
        </div>
        {hasVoted && (
          <p className="text-xs text-gray-600">
            Your vote has been recorded
          </p>
        )}
      </div>
    </div>
  );
}
