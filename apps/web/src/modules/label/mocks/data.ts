export interface MockLabel {
  id: string;
  name: string;
  color: string;
}

export interface MockAnnotation {
  id: string;
  labelId: string;
  labelName: string;
  confidence: number;
  type: "bbox" | "polygon";
  bbox?: { x: number; y: number; width: number; height: number };
  points?: [number, number][];
}

export interface MockTask {
  id: string;
  fileName: string;
  thumbnailUrl: string;
  imageUrl: string;
  annotationCount: number;
  annotations: MockAnnotation[];
  saved: boolean;
}

export const mockLabels: MockLabel[] = [
  { id: "any", name: "Any", color: "#6366f1" },
  { id: "pill-inside", name: "Pill inside", color: "#22c55e" },
  { id: "pill-outside", name: "Pill outside", color: "#f59e0b" },
  { id: "empty", name: "Empty", color: "#ef4444" },
  { id: "batch", name: "Batch", color: "#3b82f6" },
];

export const mockTasks: MockTask[] = [
  {
    id: "1",
    fileName: "IMG_0001.jpg",
    thumbnailUrl: "https://placehold.co/120x90/e2e8f0/475569?text=IMG+1",
    imageUrl: "https://placehold.co/1920x1080/e2e8f0/475569?text=IMG_0001",
    annotationCount: 22,
    saved: true,
    annotations: [
      { id: "a1", labelId: "pill-inside", labelName: "Pill inside", confidence: 0.89, type: "bbox", bbox: { x: 10, y: 15, width: 25, height: 20 } },
      { id: "a2", labelId: "pill-inside", labelName: "Pill inside", confidence: 0.89, type: "bbox", bbox: { x: 50, y: 30, width: 20, height: 25 } },
      { id: "a3", labelId: "pill-outside", labelName: "Pill outside", confidence: 0.76, type: "polygon", points: [[60, 10], [80, 10], [80, 35], [70, 40], [60, 35]] },
    ],
  },
  {
    id: "2",
    fileName: "IMG_0002.jpg",
    thumbnailUrl: "https://placehold.co/120x90/e2e8f0/475569?text=IMG+2",
    imageUrl: "https://placehold.co/1920x1080/e2e8f0/475569?text=IMG_0002",
    annotationCount: 8,
    saved: true,
    annotations: [
      { id: "a4", labelId: "pill-inside", labelName: "Pill inside", confidence: 0.92, type: "bbox", bbox: { x: 20, y: 20, width: 30, height: 30 } },
      { id: "a5", labelId: "empty", labelName: "Empty", confidence: 0.65, type: "bbox", bbox: { x: 60, y: 50, width: 25, height: 20 } },
    ],
  },
  {
    id: "3",
    fileName: "IMG_0003.jpg",
    thumbnailUrl: "https://placehold.co/120x90/e2e8f0/475569?text=IMG+3",
    imageUrl: "https://placehold.co/1920x1080/e2e8f0/475569?text=IMG_0003",
    annotationCount: 39,
    saved: false,
    annotations: [
      { id: "a6", labelId: "batch", labelName: "Batch", confidence: 0.95, type: "bbox", bbox: { x: 5, y: 5, width: 40, height: 35 } },
      { id: "a7", labelId: "pill-outside", labelName: "Pill outside", confidence: 0.81, type: "polygon", points: [[50, 50], [70, 45], [75, 65], [55, 70]] },
      { id: "a8", labelId: "any", labelName: "Any", confidence: 0.72, type: "bbox", bbox: { x: 30, y: 60, width: 15, height: 20 } },
    ],
  },
  {
    id: "4",
    fileName: "IMG_0004.jpg",
    thumbnailUrl: "https://placehold.co/120x90/e2e8f0/475569?text=IMG+4",
    imageUrl: "https://placehold.co/1920x1080/e2e8f0/475569?text=IMG_0004",
    annotationCount: 128,
    saved: true,
    annotations: [
      { id: "a9", labelId: "pill-inside", labelName: "Pill inside", confidence: 0.88, type: "bbox", bbox: { x: 15, y: 25, width: 35, height: 30 } },
      { id: "a10", labelId: "pill-inside", labelName: "Pill inside", confidence: 0.91, type: "bbox", bbox: { x: 55, y: 10, width: 30, height: 25 } },
    ],
  },
  {
    id: "5",
    fileName: "IMG_0005.jpg",
    thumbnailUrl: "https://placehold.co/120x90/e2e8f0/475569?text=IMG+5",
    imageUrl: "https://placehold.co/1920x1080/e2e8f0/475569?text=IMG_0005",
    annotationCount: 5,
    saved: true,
    annotations: [
      { id: "a11", labelId: "empty", labelName: "Empty", confidence: 0.97, type: "polygon", points: [[20, 20], [50, 15], [55, 50], [25, 55]] },
    ],
  },
];
