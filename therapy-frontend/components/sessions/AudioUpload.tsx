'use client';

import { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import {
  CloudArrowUpIcon,
  MusicalNoteIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';

interface AudioUploadProps {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  error: string | null;
}

const ACCEPTED_TYPES = {
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/x-wav': ['.wav'],
  'audio/m4a': ['.m4a'],
  'audio/x-m4a': ['.m4a'],
  'audio/mp4': ['.m4a'],
  'audio/webm': ['.webm'],
};

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileRejectionErrorMessage(rejection: FileRejection): string {
  if (rejection.errors.length === 0) return 'File rejected';

  const error = rejection.errors[0];
  
  if (error.code === 'file-too-large') {
    return `File is too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}. Your file is ${formatFileSize(rejection.file.size)}.`;
  }
  
  if (error.code === 'file-invalid-type') {
    const acceptedExtensions = Object.values(ACCEPTED_TYPES).flat().join(', ');
    return `Invalid file type. Accepted formats: ${acceptedExtensions}. Please upload an audio file (MP3, WAV, M4A, or WebM).`;
  }
  
  if (error.code === 'too-many-files') {
    return 'Only one file can be uploaded at a time.';
  }
  
  return error.message || 'File rejected. Please try again.';
}

export default function AudioUpload({ onUpload, isUploading, error }: AudioUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [dropzoneError, setDropzoneError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    // Clear previous errors
    setDropzoneError(null);
    
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errorMessage = getFileRejectionErrorMessage(rejectedFiles[0]);
      setDropzoneError(errorMessage);
      setSelectedFile(null);
      return;
    }

    // Handle accepted files
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setUploadSuccess(false);
    }
  }, []);

  const onDropRejected = useCallback((rejectedFiles: FileRejection[]) => {
    if (rejectedFiles.length > 0) {
      const errorMessage = getFileRejectionErrorMessage(rejectedFiles[0]);
      setDropzoneError(errorMessage);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    onDropRejected,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
    disabled: isUploading,
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    // Clear any previous errors
    setDropzoneError(null);

    try {
      await onUpload(selectedFile);
      setUploadSuccess(true);
      setTimeout(() => {
        setSelectedFile(null);
        setUploadSuccess(false);
      }, 2000);
    } catch {
      // Error is handled by parent component
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadSuccess(false);
    setDropzoneError(null);
  };

  // Combine dropzone errors and upload errors
  const displayError = dropzoneError || error;

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer
          ${isDragActive && !isDragReject ? 'border-indigo-500 bg-indigo-500/10' : ''}
          ${isDragReject ? 'border-red-500 bg-red-500/10' : ''}
          ${!isDragActive && !isDragReject ? 'border-[#2a2a2a] hover:border-[#3a3a3a] hover:bg-[#1a1a1a]/50' : ''}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className={`
            w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-200
            ${isDragActive ? 'bg-indigo-500/20 scale-110' : 'bg-[#1a1a1a]'}
            ${isDragReject ? 'bg-red-500/20' : ''}
          `}>
            {isDragReject ? (
              <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
            ) : (
              <CloudArrowUpIcon className={`w-8 h-8 ${isDragActive ? 'text-indigo-400' : 'text-zinc-500'}`} />
            )}
          </div>
          
          <p className="text-base font-medium text-zinc-200 mb-1">
            {isDragReject 
              ? 'Invalid file type or size' 
              : isDragActive 
                ? 'Drop your audio file here' 
                : 'Drag and drop audio file'}
          </p>
          <p className="text-sm text-zinc-500 mb-4">
            or click to browse from your computer
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-600">
            <span className="px-2 py-1 bg-[#1a1a1a] rounded-lg">MP3</span>
            <span className="px-2 py-1 bg-[#1a1a1a] rounded-lg">WAV</span>
            <span className="px-2 py-1 bg-[#1a1a1a] rounded-lg">M4A</span>
            <span className="px-2 py-1 bg-[#1a1a1a] rounded-lg">WebM</span>
            <span className="text-zinc-600">• Max {formatFileSize(MAX_FILE_SIZE)}</span>
          </div>
        </div>
      </div>

      {/* Dropzone Error Message */}
      {dropzoneError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-400 mb-1">File upload error</p>
            <p className="text-xs text-red-400/70 leading-relaxed">{dropzoneError}</p>
          </div>
        </div>
      )}

      {/* Selected File */}
      {selectedFile && (
        <div className={`
          flex items-center gap-4 p-4 rounded-xl border transition-all duration-200
          ${uploadSuccess 
            ? 'bg-emerald-500/10 border-emerald-500/30' 
            : 'bg-[#1a1a1a] border-[#2a2a2a]'
          }
        `}>
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center
            ${uploadSuccess ? 'bg-emerald-500/20' : 'bg-indigo-500/20'}
          `}>
            {uploadSuccess ? (
              <CheckCircleIcon className="w-6 h-6 text-emerald-400" />
            ) : (
              <MusicalNoteIcon className="w-6 h-6 text-indigo-400" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-zinc-500">
              {formatFileSize(selectedFile.size)}
              {uploadSuccess && <span className="text-emerald-400 ml-2">• Uploaded successfully!</span>}
            </p>
          </div>

          {!isUploading && !uploadSuccess && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="p-2 rounded-lg hover:bg-[#252525] transition-colors"
              aria-label="Remove file"
            >
              <XMarkIcon className="w-5 h-5 text-zinc-500" />
            </button>
          )}

          {!uploadSuccess && (
            <Button
              onClick={handleUpload}
              isLoading={isUploading}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          )}
        </div>
      )}

      {/* Upload Error Message (from backend) */}
      {error && !dropzoneError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <XMarkIcon className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-400 mb-1">Upload failed</p>
            <p className="text-xs text-red-400/70 leading-relaxed">{error}</p>
            {error.includes('size') && (
              <p className="text-xs text-red-400/60 mt-2">
                Maximum file size: {formatFileSize(MAX_FILE_SIZE)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
