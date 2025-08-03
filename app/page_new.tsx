'use client';

import React, { useState, useCallback, useRef } from 'react';
import { 
  Upload, 
  Download, 
  Settings, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  ImageIcon,
  Info,
  Zap,
  Cpu,
  Layers
} from 'lucide-react';

// Types
interface CompressionOptions {
  method: 'traditional' | 'ml' | 'hybrid';
  quality: number;
  targetSizeKB?: number | null;
  enableAnalysis: boolean;
}

interface CompressionResult {
  id: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  quality: number;
  method: string;
  processingTime: number;
  downloadUrl: string;
  analysis?: {
    psnr?: number;
    ssim?: number;
    mse?: number;
    entropy?: number;
    colorHistogramSimilarity?: number;
    edgePreservation?: number;
  };
}

interface ImageAnalysis {
  entropy: number;
  meanIntensity: number;
  standardDeviation: number;
  dominantColors: string[];
  complexity: 'low' | 'medium' | 'high';
  recommendation: string;
}

// Components
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Processing...' }) => (
  <div className="flex flex-col items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
    <p className="text-gray-600">{message}</p>
  </div>
);

const ErrorAlert: React.FC<{ message: string; onDismiss?: () => void }> = ({ message, onDismiss }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
    <div className="flex items-center">
      <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
      <span className="text-red-800">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="ml-auto text-red-500 hover:text-red-700">
          ×
        </button>
      )}
    </div>
  </div>
);

const SuccessAlert: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
    <div className="flex items-center">
      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
      <span className="text-green-800">{message}</span>
    </div>
  </div>
);

const ImageUpload: React.FC<{
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  isProcessing: boolean;
}> = ({ onFileSelect, selectedFile, isProcessing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : selectedFile 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 hover:border-gray-400'
        } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          disabled={isProcessing}
        />
        
        <div className="space-y-4">
          {selectedFile ? (
            <>
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <div>
                <p className="text-lg font-medium text-green-700">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-lg font-medium text-gray-700">
                  Drop your image here or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Supports JPG, PNG, WebP, and more
                </p>
              </div>
            </>
          )}
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {selectedFile ? 'Choose Different Image' : 'Browse Files'}
          </button>
        </div>
      </div>
    </div>
  );
};

const CompressionSettings: React.FC<{
  options: CompressionOptions;
  onChange: (options: CompressionOptions) => void;
  analysis: ImageAnalysis | null;
}> = ({ options, onChange, analysis }) => {
  const methodIcons = {
    traditional: Zap,
    ml: Cpu,
    hybrid: Layers
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <Settings className="h-5 w-5 text-gray-600 mr-2" />
        <h3 className="text-lg font-semibold">Compression Settings</h3>
      </div>

      {analysis && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center mb-2">
            <Info className="h-4 w-4 text-blue-600 mr-2" />
            <span className="font-medium text-blue-800">AI Recommendation</span>
          </div>
          <p className="text-sm text-blue-700">{analysis.recommendation}</p>
          <div className="mt-2 text-xs text-blue-600">
            Complexity: <span className="font-medium">{analysis.complexity}</span> | 
            Entropy: <span className="font-medium">{analysis.entropy.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Compression Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Compression Method
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['traditional', 'ml', 'hybrid'] as const).map((method) => {
              const Icon = methodIcons[method];
              return (
                <button
                  key={method}
                  onClick={() => onChange({ ...options, method })}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    options.method === method
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mx-auto mb-1" />
                  <div className="text-sm font-medium capitalize">{method}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quality Slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quality: {options.quality}%
          </label>
          <input
            type="range"
            min="10"
            max="100"
            value={options.quality}
            onChange={(e) => onChange({ ...options, quality: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Smaller file</span>
            <span>Better quality</span>
          </div>
        </div>

        {/* Target Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Size (KB) - Optional
          </label>
          <input
            type="number"
            value={options.targetSizeKB || ''}
            onChange={(e) => onChange({ 
              ...options, 
              targetSizeKB: e.target.value ? parseInt(e.target.value) : null 
            })}
            placeholder="e.g., 500"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Analysis Toggle */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="analysis"
            checked={options.enableAnalysis}
            onChange={(e) => onChange({ ...options, enableAnalysis: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="analysis" className="ml-2 text-sm text-gray-700">
            Enable detailed analysis (PSNR, SSIM, etc.)
          </label>
        </div>
      </div>
    </div>
  );
};

const ResultsDisplay: React.FC<{
  result: CompressionResult;
  originalFile: File;
  onDownload: () => void;
}> = ({ result, originalFile, onDownload }) => {
  const compressionPercent = ((result.originalSize - result.compressedSize) / result.originalSize * 100);
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Compression Results</h3>
        <button
          onClick={onDownload}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-800">
            {(result.originalSize / 1024 / 1024).toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Original (MB)</div>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {(result.compressedSize / 1024 / 1024).toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Compressed (MB)</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {compressionPercent.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Size Reduction</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {result.processingTime.toFixed(1)}s
          </div>
          <div className="text-sm text-gray-600">Processing Time</div>
        </div>
      </div>

      {result.analysis && (
        <div className="mt-6">
          <h4 className="font-semibold mb-3">Quality Analysis</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {result.analysis.psnr && (
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="font-bold">{result.analysis.psnr.toFixed(2)} dB</div>
                <div className="text-xs text-gray-600">PSNR</div>
              </div>
            )}
            {result.analysis.ssim && (
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="font-bold">{result.analysis.ssim.toFixed(3)}</div>
                <div className="text-xs text-gray-600">SSIM</div>
              </div>
            )}
            {result.analysis.entropy && (
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="font-bold">{result.analysis.entropy.toFixed(2)}</div>
                <div className="text-xs text-gray-600">Entropy</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Main Component
export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressionOptions, setCompressionOptions] = useState<CompressionOptions>({
    method: 'traditional',
    quality: 85,
    targetSizeKB: null,
    enableAnalysis: true
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [analysis, setAnalysis] = useState<ImageAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const analyzeImage = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const analysisData = await response.json();
        setAnalysis(analysisData);
      }
    } catch (error) {
      console.warn('Image analysis failed:', error);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setResult(null);
    setError(null);
    setSuccess(null);
    
    // Analyze the image
    analyzeImage(file);
  };

  const compressImage = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('method', compressionOptions.method);
      formData.append('quality', compressionOptions.quality.toString());
      if (compressionOptions.targetSizeKB) {
        formData.append('targetSizeKB', compressionOptions.targetSizeKB.toString());
      }
      formData.append('enableAnalysis', compressionOptions.enableAnalysis.toString());

      const response = await fetch('http://localhost:5239/api/compression/compress', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Compression failed');
      }

      const resultData: CompressionResult = await response.json();
      setResult(resultData);
      setSuccess('Image compressed successfully!');
    } catch (error) {
      console.error('Compression error:', error);
      setError(error instanceof Error ? error.message : 'Failed to compress image');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadCompressedImage = async () => {
    if (!result) return;

    try {
      const response = await fetch(`http://localhost:5239/api/compression/download/${result.id}`);
      if (!response.ok) throw new Error('Failed to download');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compressed_${selectedFile?.name || 'image'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setError('Failed to download compressed image');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <ImageIcon className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">AI Image Compression</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
        {success && <SuccessAlert message={success} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload and Settings */}
          <div className="lg:col-span-2 space-y-6">
            <ImageUpload
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              isProcessing={isProcessing}
            />

            {selectedFile && (
              <CompressionSettings
                options={compressionOptions}
                onChange={setCompressionOptions}
                analysis={analysis}
              />
            )}

            {selectedFile && !isProcessing && (
              <button
                onClick={compressImage}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Compress Image
              </button>
            )}

            {isProcessing && (
              <LoadingSpinner message="Compressing your image..." />
            )}
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {result && selectedFile && (
              <ResultsDisplay
                result={result}
                originalFile={selectedFile}
                onDownload={downloadCompressedImage}
              />
            )}

            {!result && !isProcessing && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Compress</h3>
                <p className="text-gray-600">
                  Upload an image and configure your compression settings to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
