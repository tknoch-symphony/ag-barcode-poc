"use client";
import { useRef, useEffect, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

export default function BarcodeScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [result, setResult] = useState<string>('');

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let active = true;

    // helper to start decoding from a MediaStream
    const startDecodeFromStream = (stream: MediaStream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        codeReader.decodeFromVideoElement(videoRef.current, (result, err) => {
          if (!active) return;
          if (result) {
            setResult(result.getText());
          }
        });
      }
    };

    BrowserMultiFormatReader
      .listVideoInputDevices()
      .then((videoInputDevices) => {
        // pick the back camera if available
        const deviceId =
          videoInputDevices.find((d) =>
            /back|rear|environment/gi.test(d.label)
          )?.deviceId || videoInputDevices[0].deviceId;

        codeReader.decodeFromVideoDevice(
          deviceId,
          videoRef.current!,
          (result, err) => {
            if (!active) return;
            if (result) {
              setResult(result.getText());
            }
          }
        );
      })
      .catch((err) => {
        console.warn('Cannot enumerate devices, falling back to default camera-facing stream', err);
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: { ideal: 'environment' } } })
          .then(startDecodeFromStream)
          .catch((streamErr) => console.error('getUserMedia error:', streamErr));
      });

    return () => {
      active = false;
      codeReader.reset();
    };
  }, []);

  return (
    <div className="scanner">
      <video
        ref={videoRef}
        style={{ width: '100%', maxWidth: 400, borderRadius: 8 }}
        muted
      />
      <p className="mt-4 text-lg">Scanned Code: <strong>{result || '–––'}</strong></p>
    </div>
  );
}