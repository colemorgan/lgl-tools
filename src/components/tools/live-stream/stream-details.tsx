'use client';

import { useState, useEffect } from 'react';
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
import {
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import type { LiveStream } from '@/types';

interface StreamDetailsProps {
  stream: LiveStream;
  onBack: () => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export function StreamDetails({
  stream: initialStream,
  onBack,
  onDelete,
  onRefresh,
}: StreamDetailsProps) {
  const [stream, setStream] = useState(initialStream);
  const [cloudflareStatus, setCloudflareStatus] = useState<string>('unknown');
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const hostedPlayerUrl = `${appUrl}/live/${stream.id}`;

  const refreshStatus = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/streams/${stream.id}`);
      if (res.ok) {
        const data = await res.json();
        setStream(data);
        setCloudflareStatus(data.cloudflare_status ?? 'unknown');
      }
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refreshStatus();
    // Poll every 10 seconds for live status
    const interval = setInterval(refreshStatus, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream.id]);

  const handleDelete = async () => {
    if (!confirm('Delete this stream? This cannot be undone.')) return;
    setDeleting(true);
    await onDelete(stream.id);
    onRefresh();
  };

  const statusColor: Record<string, string> = {
    created: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    connected: 'bg-green-100 text-green-800 border-green-200',
    disconnected: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Streams
      </Button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-semibold">{stream.name}</h1>
          <p className="text-muted-foreground text-sm">
            Created {new Date(stream.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={statusColor[stream.status] || statusColor.created}
          >
            {stream.status}
          </Badge>
          <Button
            variant="outline"
            size="icon"
            onClick={refreshStatus}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {cloudflareStatus === 'connected' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6 text-sm text-green-800">
          Stream is live and receiving video.
        </div>
      )}

      <div className="space-y-4">
        {/* RTMP Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">RTMP Connection</CardTitle>
            <CardDescription>
              Use these details in OBS, vMix, or any RTMP encoder.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <CopyField label="RTMP URL" value={stream.rtmp_url} />
            <CopyField label="Stream Key" value={stream.rtmp_stream_key} secret />
          </CardContent>
        </Card>

        {/* Playback URLs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Playback</CardTitle>
            <CardDescription>
              Share these URLs with your audience or embed in a custom player.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <CopyField label="HLS Playback URL" value={stream.hls_playback_url} />
            <div className="flex items-center justify-between">
              <CopyField label="Hosted Player URL" value={hostedPlayerUrl} />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(hostedPlayerUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Player Page
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Delete Stream</CardTitle>
            <CardDescription>
              Permanently remove this stream and its Cloudflare live input.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Spinner size="sm" className="mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Stream
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CopyField({
  label,
  value,
  secret = false,
}: {
  label: string;
  value: string;
  secret?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayValue = secret && !revealed ? '••••••••••••••••' : value;

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2 mt-1">
        <code className="flex-1 text-xs bg-muted rounded px-3 py-2 font-mono break-all">
          {displayValue}
        </code>
        {secret && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRevealed(!revealed)}
            className="shrink-0"
          >
            {revealed ? 'Hide' : 'Show'}
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={copy} className="shrink-0">
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
