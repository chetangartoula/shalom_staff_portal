
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCcw, Check } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';

interface CameraCaptureProps {
  onCapture: (imageSrc: string) => void;
}

export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Not Supported',
          description: 'Your browser does not support camera access.',
        });
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
    };

    getCameraPermission();

    return () => {
      // Cleanup: stop the camera stream when the component unmounts
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);

  const handleCapture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
      }
    }
  }, []);

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };
  
  return (
    <div className="w-full space-y-4">
      {hasCameraPermission === false && (
        <Alert variant="destructive">
          <AlertTitle>Camera Access Required</AlertTitle>
          <AlertDescription>
            Please allow camera access in your browser settings to use this feature.
          </AlertDescription>
        </Alert>
      )}

      <div className="relative w-full aspect-video rounded-md border bg-muted overflow-hidden">
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${capturedImage ? 'hidden' : 'block'}`}
          autoPlay
          playsInline
          muted
        />
        {capturedImage && (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex justify-center gap-4">
        {capturedImage ? (
          <>
            <Button variant="outline" onClick={handleRetake}>
              <RefreshCcw className="mr-2 h-4 w-4" /> Retake
            </Button>
            <Button onClick={handleConfirm}>
              <Check className="mr-2 h-4 w-4" /> Confirm
            </Button>
          </>
        ) : (
          <Button onClick={handleCapture} disabled={!hasCameraPermission}>
            <Camera className="mr-2 h-4 w-4" /> Capture Photo
          </Button>
        )}
      </div>
    </div>
  );
}

    