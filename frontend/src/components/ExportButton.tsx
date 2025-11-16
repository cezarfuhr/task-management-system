'use client';

import { Download } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import toast from 'react-hot-toast';
import { saveAs } from 'file-saver';

interface ExportButtonProps {
  boardId: string;
  boardTitle: string;
}

export function ExportButton({ boardId, boardTitle }: ExportButtonProps) {
  const exportCSV = trpc.export.toCSV.useMutation({
    onSuccess: (csv) => {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, `${boardTitle}-tasks.csv`);
      toast.success('Exported to CSV');
    },
    onError: () => {
      toast.error('Export failed');
    },
  });

  const exportPDF = trpc.export.toPDF.useMutation({
    onSuccess: (pdfBuffer) => {
      const blob = new Blob([Buffer.from(pdfBuffer)], { type: 'application/pdf' });
      saveAs(blob, `${boardTitle}-board.pdf`);
      toast.success('Exported to PDF');
    },
    onError: () => {
      toast.error('Export failed');
    },
  });

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition">
        <Download className="w-4 h-4" />
        Export
      </button>

      <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition z-10">
        <button
          onClick={() => exportCSV.mutate({ boardId })}
          disabled={exportCSV.isLoading}
          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg transition text-sm"
        >
          {exportCSV.isLoading ? 'Exporting...' : 'Export as CSV'}
        </button>
        <button
          onClick={() => exportPDF.mutate({ boardId })}
          disabled={exportPDF.isLoading}
          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg transition text-sm"
        >
          {exportPDF.isLoading ? 'Exporting...' : 'Export as PDF'}
        </button>
      </div>
    </div>
  );
}
