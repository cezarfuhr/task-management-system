'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Clock } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import toast from 'react-hot-toast';

interface TimeTrackerProps {
  taskId: string;
}

export function TimeTracker({ taskId }: TimeTrackerProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [description, setDescription] = useState('');

  const logTimeMutation = trpc.time.logEntry.useMutation({
    onSuccess: () => {
      toast.success('Time logged successfully');
      setDescription('');
      setElapsed(0);
    },
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isTracking && startTime) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isTracking, startTime]);

  const handleStart = () => {
    setIsTracking(true);
    setStartTime(new Date());
  };

  const handlePause = () => {
    setIsTracking(false);
  };

  const handleSave = () => {
    if (!startTime) return;

    const endTime = new Date();
    const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    logTimeMutation.mutate({
      taskId,
      hours: Number(hours.toFixed(2)),
      description,
      startTime,
      endTime,
      isBillable: false,
    });

    setIsTracking(false);
    setStartTime(null);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-gray-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Time Tracker</h3>
      </div>

      <div className="text-center mb-4">
        <div className="text-4xl font-mono font-bold text-gray-900 dark:text-white">
          {formatTime(elapsed)}
        </div>
      </div>

      {isTracking && (
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What are you working on?"
          className="w-full px-3 py-2 mb-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
        />
      )}

      <div className="flex gap-2">
        {!isTracking ? (
          <button
            onClick={handleStart}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
          >
            <Play className="w-4 h-4" />
            Start
          </button>
        ) : (
          <>
            <button
              onClick={handlePause}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition"
            >
              <Pause className="w-4 h-4" />
              Pause
            </button>
            <button
              onClick={handleSave}
              disabled={logTimeMutation.isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
            >
              Save
            </button>
          </>
        )}
      </div>
    </div>
  );
}
