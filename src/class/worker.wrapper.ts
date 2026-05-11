export type ProgressData = {
  transferredBytes: number;
  totalBytes: number;
  speed: number;
  percentage: number;
  timeLeft: number;
  ended: boolean;
  fileName?: string;
  comment?: string;
};
