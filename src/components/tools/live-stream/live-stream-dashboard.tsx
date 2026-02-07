'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Radio, Plus, Trash2, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import type { LiveStream } from '@/types';
import { StreamDetails } from './stream-details';

export function LiveStreamDashboard() {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStreams = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/streams');
      if (!res.ok) throw new Error('Failed to fetch streams');
      const data = await res.json();
      setStreams(data);
    } catch {
      setError('Failed to load streams');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStreams();
    // Poll every 10 seconds so webhook-driven status changes appear
    const interval = setInterval(fetchStreams, 10000);
    return () => clearInterval(interval);
  }, [fetchStreams]);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to create stream');
      }
      const stream = await res.json();
      setStreams((prev) => [stream, ...prev]);
      setSelectedStream(stream);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create stream');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (streamId: string) => {
    try {
      const res = await fetch(`/api/streams/${streamId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete stream');
      setStreams((prev) => prev.filter((s) => s.id !== streamId));
      if (selectedStream?.id === streamId) {
        setSelectedStream(null);
      }
    } catch {
      setError('Failed to delete stream');
    }
  };

  if (selectedStream) {
    return (
      <StreamDetails
        stream={selectedStream}
        onBack={() => setSelectedStream(null)}
        onDelete={handleDelete}
        onRefresh={fetchStreams}
      />
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-heading font-semibold flex items-center gap-2">
            <Radio className="h-6 w-6" />
            Backup Live Stream
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage live streams with RTMP ingest and hosted players.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchStreams} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            New Live Stream
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : streams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Radio className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No streams yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Create your first live stream to get started.
            </p>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? (
                <Spinner size="sm" className="mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              New Live Stream
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {streams.map((stream) => (
            <StreamCard
              key={stream.id}
              stream={stream}
              onClick={() => setSelectedStream(stream)}
              onDelete={() => handleDelete(stream.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StreamCard({
  stream,
  onClick,
  onDelete,
}: {
  stream: LiveStream;
  onClick: () => void;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const hostedPlayerUrl = `${appUrl}/live/${stream.id}`;

  const copyUrl = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(hostedPlayerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusColor: Record<string, string> = {
    created: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    connected: 'bg-green-100 text-green-800 border-green-200',
    disconnected: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">{stream.name}</CardTitle>
            <Badge
              variant="outline"
              className={`${statusColor[stream.status] || statusColor.created} flex items-center gap-1.5`}
            >
              {stream.status === 'connected' && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
              )}
              {stream.status}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={copyUrl}
              title="Copy player URL"
            >
              {copied ? (
                <span className="text-xs text-green-600">Copied</span>
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                window.open(hostedPlayerUrl, '_blank');
              }}
              title="Open player"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this stream? This cannot be undone.')) {
                  onDelete();
                }
              }}
              title="Delete stream"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
        <CardDescription className="text-xs">
          Created {new Date(stream.created_at).toLocaleString()}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
