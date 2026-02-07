'use client';

import { Radio } from 'lucide-react';

interface HostedPlayerProps {
  streamName: string;
  iframeSrc: string;
}

export function HostedPlayer({ streamName, iframeSrc }: HostedPlayerProps) {

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Player */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-6xl aspect-video">
          <iframe
            src={iframeSrc}
            className="w-full h-full"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 px-6 flex items-center justify-between text-gray-400 text-sm">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-red-500" />
          <span className="text-white font-medium">{streamName}</span>
        </div>
        <span className="text-xs">
          Powered by Let&apos;s Go Live
        </span>
      </div>
    </div>
  );
}
