import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isToday, isYesterday, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes} min`;
}

export function formatDistance(km?: number) {
  if (km === undefined) return '-';
  return `${km.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
}

export function formatDate(date: Date) {
  if (isToday(date)) return 'Hoje';
  if (isYesterday(date)) return 'Ontem';
  
  const currentYear = new Date().getFullYear();
  if (date.getFullYear() === currentYear) {
    return format(date, "dd MMM", { locale: ptBR });
  }
  return format(date, "dd MMM yyyy", { locale: ptBR });
}

export function calcAvgSpeed(distKm: number, durationSec: number) {
  if (durationSec === 0) return 0;
  return (distKm / (durationSec / 3600));
}

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  
  // Regex for standard, short, and shorts URLs
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  
  return (match && match[2].length === 11) ? match[2] : null;
}

export function playBeep() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.error('Error playing beep:', error);
  }
}

export function calculateIMC(weightKg: number, heightCm: number) {
  if (!weightKg || !heightCm) return { bmi: 0, label: '-' };
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  
  let label: string;
  if (bmi < 18.5) label = 'Abaixo do peso';
  else if (bmi < 25) label = 'Normal';
  else if (bmi < 30) label = 'Sobrepeso';
  else if (bmi < 35) label = 'Obesidade I';
  else if (bmi < 40) label = 'Obesidade II';
  else label = 'Obesidade III';

  return { bmi: parseFloat(bmi.toFixed(1)), label };
}

export function calculateBodyFat(
  gender: 'M' | 'F',
  heightCm: number,
  waistCm: number,
  neckCm: number,
  hipCm?: number
) {
  if (!heightCm || !waistCm || !neckCm) return null;
  if (gender === 'F' && !hipCm) return null;

  let bodyFat: number;
  if (gender === 'M') {
    // Navy Method for Men
    bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) - 450;
  } else {
    // Navy Method for Women
    bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(waistCm + (hipCm || 0) - neckCm) + 0.22100 * Math.log10(heightCm)) - 450;
  }

  if (bodyFat < 0) bodyFat = 0;
  
  let label: string;
  if (gender === 'M') {
    if (bodyFat < 6) label = 'Essencial';
    else if (bodyFat < 14) label = 'Atleta';
    else if (bodyFat < 18) label = 'Fitness';
    else if (bodyFat < 25) label = 'Médio';
    else label = 'Obeso';
  } else {
    if (bodyFat < 14) label = 'Essencial';
    else if (bodyFat < 21) label = 'Atleta';
    else if (bodyFat < 25) label = 'Fitness';
    else if (bodyFat < 32) label = 'Médio';
    else label = 'Obesa';
  }

  return { bf: parseFloat(bodyFat.toFixed(1)), label };
}

export function calculateWHR(gender: 'M' | 'F', waistCm: number, hipCm: number) {
  if (!waistCm || !hipCm) return null;
  const whr = waistCm / hipCm;
  
  let risk: string;
  if (gender === 'M') {
    if (whr < 0.9) risk = 'Baixo';
    else if (whr < 1.0) risk = 'Moderado';
    else risk = 'Alto';
  } else {
    if (whr < 0.8) risk = 'Baixo';
    else if (whr < 0.85) risk = 'Moderado';
    else risk = 'Alto';
  }

  return { ratio: parseFloat(whr.toFixed(2)), risk };
}

export function calculateIdealWeight(gender: 'M' | 'F', heightCm: number) {
  if (!heightCm) return 0;
  
  // Devine Formula
  const inchesOver5Feet = (heightCm / 2.54) - 60;
  let weight: number;
  
  if (gender === 'M') {
    weight = 50 + (2.3 * inchesOver5Feet);
  } else {
    weight = 45.5 + (2.3 * inchesOver5Feet);
  }
  
  return parseFloat(weight.toFixed(1));
}

export function calculateAge(birthdate: Date | string) {
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function formatRelativeUpdate(date: Date) {
  const diff = differenceInDays(new Date(), date);
  if (diff === 0) return 'Atualizado hoje';
  if (diff === 1) return 'Atualizado ontem';
  return `Atualizado há ${diff} dias`;
}

export const hapticFeedback = {
  light: () => {
    if ('vibrate' in navigator) navigator.vibrate(10);
  },
  medium: () => {
    if ('vibrate' in navigator) navigator.vibrate(50);
  },
  success: () => {
    if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
  },
  error: () => {
    if ('vibrate' in navigator) navigator.vibrate([300, 100, 300]);
  },
  workoutComplete: () => {
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200, 100, 400]);
  }
};

export async function compressImage(file: File, maxWidth = 800, quality = 0.7, maxSizeKb?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio and only downscale
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Recursive function to meet maxSizeKb if provided
        const getBlob = (q: number) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                if (maxSizeKb && blob.size > maxSizeKb * 1024 && q > 0.1) {
                  getBlob(q - 0.1); // Reduce quality and try again
                } else {
                  resolve(blob);
                }
              } else {
                reject(new Error('Canvas to Blob failed'));
              }
            },
            'image/jpeg',
            q
          );
        };

        getBlob(quality);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
