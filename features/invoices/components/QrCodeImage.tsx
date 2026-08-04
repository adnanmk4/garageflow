"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export function QrCodeImage({ value, size = 120 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, value, { width: size, margin: 1 }).catch(() => {});
    }
  }, [value, size]);

  return <canvas ref={canvasRef} width={size} height={size} className="rounded-md" />;
}
