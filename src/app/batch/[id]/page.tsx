'use client';

// Story 1.6: Batch Status/Preview Page
// Real-time monitoring of batch video generation

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, XCircle, Clock, Download, ArrowLeft, RefreshCw, LayoutGrid, LayoutList } from 'lucide-react';
import type { BatchStatusResponse, VideoStatus } from '@/app/api/batch/[id]/route';

const POLL_INTERVAL = 10000; // Poll every 10 seconds

type ViewMode = 'list' | 'grid';

export default function BatchStatusPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.id as string;

  const [batch, setBatch] = useState<BatchStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Fetch batch status
  const fetchBatchStatus = async () => {
    try {
      const response = await fetch(`/api/batch/${batchId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch batch status');
      }

      const data: BatchStatusResponse = await response.json();
      setBatch(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('[Batch Status] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchBatchStatus();
  }, [batchId]);

  // Auto-refresh while generating
  useEffect(() => {
    if (!batch || batch.status === 'completed' || batch.status === 'failed') {
      return; // Stop polling when batch is complete
    }

    const interval = setInterval(() => {
      fetchBatchStatus();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [batch]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] p-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#f5f5f5]" />
        <p className="mt-4 text-[#f5f5f5]/60">Loading batch status...</p>
      </main>
    );
  }

  if (error || !batch) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] p-4">
        <XCircle className="h-12 w-12 text-red-500" />
        <p className="mt-4 text-[#f5f5f5]">Error: {error || 'Batch not found'}</p>
        <Button
          onClick={() => router.push('/dashboard')}
          className="mt-4 bg-[#8B7355] hover:bg-[#A0826D]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </main>
    );
  }

  const isGenerating = batch.status === 'generating' || batch.status === 'initializing';

  return (
    <main className="min-h-screen bg-[#0a0a0a] p-4 text-[#f5f5f5] md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              onClick={() => router.push('/dashboard')}
              variant="ghost"
              className="mb-2 text-[#f5f5f5]/60 hover:text-[#f5f5f5]"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Batch Status</h1>
            <p className="text-[#f5f5f5]/60">Batch ID: {batch.batchId}</p>
          </div>
          <Button
            onClick={fetchBatchStatus}
            variant="outline"
            className="border-[#8B7355] text-[#f5f5f5]"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Batch Overview */}
        <Card className="border-[#2a2a2a] bg-[#1a1a1a]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[#f5f5f5]">
                  {batch.bigIdea}
                </CardTitle>
                <CardDescription className="text-[#f5f5f5]/60">
                  Brand: {batch.brand} • Created: {new Date(batch.createdAt).toLocaleString()}
                </CardDescription>
              </div>
              <BatchStatusBadge status={batch.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-[#f5f5f5]/60">Progress</span>
                <span className="text-[#f5f5f5]">{batch.progressPercentage}%</span>
              </div>
              <Progress value={batch.progressPercentage} className="h-2" />
            </div>

            {/* Status Counts */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatusCard
                label="Total Videos"
                count={batch.totalVideos}
                icon={<Clock className="h-5 w-5" />}
                color="text-blue-500"
              />
              <StatusCard
                label="Queued"
                count={batch.queuedCount}
                icon={<Clock className="h-5 w-5" />}
                color="text-yellow-500"
              />
              <StatusCard
                label="In Progress"
                count={batch.inProgressCount}
                icon={<Loader2 className="h-5 w-5 animate-spin" />}
                color="text-blue-500"
              />
              <StatusCard
                label="Completed"
                count={batch.completedCount}
                icon={<CheckCircle2 className="h-5 w-5" />}
                color="text-green-500"
              />
            </div>

            {/* Failed Count (if any) */}
            {batch.failedCount > 0 && (
              <div className="rounded-md border border-red-500/20 bg-red-500/10 p-4">
                <div className="flex items-center">
                  <XCircle className="mr-2 h-5 w-5 text-red-500" />
                  <span className="text-red-500">{batch.failedCount} videos failed</span>
                </div>
              </div>
            )}

            {/* Estimated Completion */}
            {batch.estimatedCompletionTime && isGenerating && (
              <div className="rounded-md border border-[#2a2a2a] bg-[#0a0a0a] p-4">
                <p className="text-sm text-[#f5f5f5]/60">Estimated Completion</p>
                <p className="text-[#f5f5f5]">
                  {new Date(batch.estimatedCompletionTime).toLocaleString()}
                </p>
              </div>
            )}

            {/* Last Updated */}
            {lastUpdated && (
              <p className="text-xs text-[#f5f5f5]/40">
                Last updated: {lastUpdated.toLocaleTimeString()}
                {isGenerating && ' • Auto-refreshing every 10 seconds'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Video List/Grid */}
        <Card className="border-[#2a2a2a] bg-[#1a1a1a]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[#f5f5f5]">Video Variations</CardTitle>
                <CardDescription className="text-[#f5f5f5]/60">
                  {batch.totalVideos} videos • {batch.completedCount} completed
                </CardDescription>
              </div>
              {/* View Toggle */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-[#8B7355] hover:bg-[#A0826D]' : 'border-[#8B7355] text-[#f5f5f5]'}
                >
                  <LayoutList className="h-4 w-4 mr-2" />
                  List
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-[#8B7355] hover:bg-[#A0826D]' : 'border-[#8B7355] text-[#f5f5f5]'}
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Grid
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === 'list' ? (
              <div className="space-y-3">
                {batch.videos.map((video) => (
                  <VideoCard key={video.combinationId} video={video} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {batch.videos.map((video) => (
                  <VideoGridCard key={video.combinationId} video={video} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

// Batch Status Badge
function BatchStatusBadge({ status }: { status: BatchStatusResponse['status'] }) {
  const config = {
    initializing: { label: 'Initializing', className: 'bg-blue-500/20 text-blue-500' },
    generating: { label: 'Generating', className: 'bg-yellow-500/20 text-yellow-500' },
    completed: { label: 'Completed', className: 'bg-green-500/20 text-green-500' },
    failed: { label: 'Failed', className: 'bg-red-500/20 text-red-500' },
    partial: { label: 'Partial', className: 'bg-orange-500/20 text-orange-500' },
  };

  const { label, className } = config[status];

  return <Badge className={className}>{label}</Badge>;
}

// Status Card
function StatusCard({
  label,
  count,
  icon,
  color,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-md border border-[#2a2a2a] bg-[#0a0a0a] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#f5f5f5]/60">{label}</p>
          <p className="text-2xl font-bold text-[#f5f5f5]">{count}</p>
        </div>
        <div className={color}>{icon}</div>
      </div>
    </div>
  );
}

// Video Card
function VideoCard({ video }: { video: VideoStatus }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-[#2a2a2a] bg-[#0a0a0a] p-4">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <VideoStatusIcon status={video.status} />
          <div>
            <p className="font-medium text-[#f5f5f5]">
              {video.funnelLevel} • {video.aesthetic} • {video.contentType}
            </p>
            <p className="text-sm text-[#f5f5f5]/60">
              {video.intention} • {video.mood} • {video.demographic}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {video.status === 'Failed' && video.errorMessage && (
          <p className="mt-2 text-xs text-red-500">Error: {video.errorMessage}</p>
        )}

        {/* Progress */}
        {video.status === 'In Progress' && video.progress !== undefined && (
          <div className="mt-2">
            <Progress value={video.progress} className="h-1" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="ml-4 flex items-center gap-2">
        {video.videoUrl && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(video.videoUrl, '_blank')}
            className="border-[#8B7355] text-[#f5f5f5]"
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        )}
        <span className="text-sm text-[#f5f5f5]/60">${video.cost.toFixed(2)}</span>
      </div>
    </div>
  );
}

// Video Status Icon
function VideoStatusIcon({ status }: { status: VideoStatus['status'] }) {
  switch (status) {
    case 'Queued':
      return <Clock className="h-5 w-5 text-yellow-500" />;
    case 'In Progress':
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    case 'Completed':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'Failed':
      return <XCircle className="h-5 w-5 text-red-500" />;
  }
}

// Video Grid Card (Google Drive-style card view)
function VideoGridCard({ video }: { video: VideoStatus }) {
  return (
    <div className="group relative rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] overflow-hidden hover:border-[#8B7355] transition-colors">
      {/* Thumbnail/Preview Area */}
      <div className="relative aspect-video bg-[#1a1a1a] flex items-center justify-center">
        {video.status === 'Completed' && video.videoUrl ? (
          <div className="relative w-full h-full">
            {/* Video thumbnail would go here */}
            <div className="absolute inset-0 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            {/* Play button overlay on hover */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                size="sm"
                onClick={() => window.open(video.videoUrl, '_blank')}
                className="bg-[#8B7355] hover:bg-[#A0826D]"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        ) : video.status === 'In Progress' ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            {video.progress !== undefined && (
              <div className="w-full px-4">
                <Progress value={video.progress} className="h-1" />
                <p className="text-xs text-[#f5f5f5]/60 text-center mt-1">{video.progress}%</p>
              </div>
            )}
          </div>
        ) : video.status === 'Failed' ? (
          <XCircle className="h-12 w-12 text-red-500" />
        ) : (
          <Clock className="h-12 w-12 text-yellow-500" />
        )}
      </div>

      {/* Video Info */}
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-medium text-[#f5f5f5] line-clamp-1">
            {video.aesthetic}
          </h3>
          <VideoStatusIcon status={video.status} />
        </div>

        <p className="text-xs text-[#f5f5f5]/60 line-clamp-2 mb-2">
          {video.funnelLevel} • {video.contentType}
        </p>

        <p className="text-xs text-[#f5f5f5]/40 line-clamp-1">
          {video.intention} • {video.mood}
        </p>

        {/* Error Message */}
        {video.status === 'Failed' && video.errorMessage && (
          <p className="mt-2 text-xs text-red-500 line-clamp-2">Error: {video.errorMessage}</p>
        )}

        {/* Cost */}
        <div className="mt-2 pt-2 border-t border-[#2a2a2a] flex items-center justify-between">
          <span className="text-xs text-[#f5f5f5]/60">Cost:</span>
          <span className="text-xs font-medium text-[#f5f5f5]">${video.cost.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
