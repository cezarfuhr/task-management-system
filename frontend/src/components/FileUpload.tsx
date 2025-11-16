'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

interface FileUploadProps {
  taskId: string;
  files: any[];
  onUploadComplete: () => void;
}

export function FileUpload({ taskId, files, onUploadComplete }: FileUploadProps) {
  const { user } = useAuth();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Max size is 10MB`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('taskId', taskId);

        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: formData,
          });

          if (response.ok) {
            toast.success(`${file.name} uploaded successfully`);
            onUploadComplete();
          } else {
            toast.error(`Failed to upload ${file.name}`);
          }
        } catch (error) {
          toast.error(`Error uploading ${file.name}`);
        }
      }
    },
    [taskId, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 10 * 1024 * 1024,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
          isDragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isDragActive
            ? 'Drop files here...'
            : 'Drag & drop files here, or click to select'}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Max file size: 10MB
        </p>
      </div>

      {files && files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
            Attached Files ({files.length})
          </h4>
          {files.map((file: any) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <File className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {file.originalName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={file.url}
                  download
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </a>
                {file.uploadedBy === user?.id && (
                  <button
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded transition"
                    title="Delete"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
