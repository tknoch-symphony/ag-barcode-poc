"use client";

import React, { useRef, useEffect, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

interface UdiResponse {
  udi: string;
  issuingAgency: string;
  di: string;
  expirationDateOriginal: string;
  expirationDateOriginalFormat: string;
  expirationDate: string;
  lotNumber: string;
}

export default function BarcodeScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [result, setResult] = useState<string>("");
  const [udiData, setUdiData] = useState<UdiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1) Start the camera & decode loop
  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let active = true;

    (async () => {
      try {
        await codeReader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } } },
          videoRef.current!,
          (scanResult, scanError, controls) => {
            if (!active) return;
            if (scanResult) {
              const udi = scanResult.getText();
              setResult(udi);
              controls.stop();               // stop scanning on first hit
            }
          }
        );
      } catch (err) {
        console.error("ZXing scan error:", err);
        setError("Failed to access camera or decode barcode.");
      }
    })();

    return () => {
      active = false;
      //codeReader.reset();
    };
  }, []);

  // 2) When `result` changes, fire off the fetch
  useEffect(() => {
    if (!result) return;

    const fetchUdi = async () => {
      try {
        const res = await fetch(
          `https://accessgudid.nlm.nih.gov/api/v3/parse_udi.json?udi=${encodeURIComponent(
            result
          )}`
        );
        if (!res.ok) {
          throw new Error(`Status ${res.status}`);
        }
        const data: UdiResponse = await res.json();
        setUdiData(data);
        setError(null);
      } catch (err) {
        console.error("UDI fetch error:", err);
        setError("Could not fetch UDI details.");
      }
    };

    fetchUdi();
  }, [result]);

  return (
    <div className="scanner p-4">
      <video
        ref={videoRef}
        className="w-full max-w-xs rounded"
        muted
        autoPlay
        playsInline
      />

      <p className="mt-4 text-lg">
        Scanned Code: <strong>{result || "–––"}</strong>
      </p>

      {error && (
        <p className="mt-2 text-red-600">
          Error: {error}
        </p>
      )}

      {udiData && (
        <div className="mt-4 space-y-1 text-left bg-gray-50 p-3 rounded shadow-sm w-full max-w-xs">
          <p><strong>UDI:</strong> {udiData.udi}</p>
          <p><strong>Issuing Agency:</strong> {udiData.issuingAgency}</p>
          <p><strong>DI:</strong> {udiData.di}</p>
          <p>
            <strong>Original Expiration:</strong>{" "}
            {udiData.expirationDateOriginal} (format:{" "}
            {udiData.expirationDateOriginalFormat})
          </p>
          <p><strong>Expiration:</strong> {udiData.expirationDate}</p>
          <p><strong>Lot Number:</strong> {udiData.lotNumber}</p>
        </div>
      )}
    </div>
  );
}