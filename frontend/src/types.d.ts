interface BarcodeDetectorOptions {
  formats: string[]
}

interface DetectedBarcode {
  rawValue: string
  boundingBox: DOMRectReadOnly
  format: string
  cornerPoints: readonly { x: number; y: number }[]
}

declare class BarcodeDetector {
  constructor(options?: BarcodeDetectorOptions)
  static getSupportedFormats(): Promise<string[]>
  detect(image: ImageBitmap | HTMLCanvasElement | HTMLVideoElement | HTMLImageElement | Blob): Promise<DetectedBarcode[]>
}
