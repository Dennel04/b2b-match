import { Geist, Geist_Mono } from 'next/font/google';
import { View } from './_View';

/**
 * Variant H, skill: emil-design-eng (Emil Kowalski).
 * The look stays quiet (Vercel / Sonner family); the skill is spent on how things respond:
 * - buttons scale to 0.97 on press, 160ms ease-out, transitions name exact properties
 * - tabs slide an indicator with a strong ease-out, no animation on keyboard switching
 * - rows expand with grid-template-rows (interruptible CSS transition, not keyframes)
 * - hold-to-confirm uses clip-path fill: slow linear while holding, fast snap back on release
 * - toast enters and exits from the same edge; stagger on first load is 50ms per item
 * Custom curves: --ease-out cubic-bezier(0.23,1,0.32,1), --ease-drawer cubic-bezier(0.32,0.72,0,1).
 */

const geist = Geist({ subsets: ['latin'], variable: '--h-sans' });
const mono = Geist_Mono({ subsets: ['latin'], variable: '--h-mono' });

export const metadata = { title: 'H · emil-design-eng — Lab' };

export default function VariantH() {
  return (
    <div className={`${geist.variable} ${mono.variable} min-h-dvh bg-[#FAFAFA] pb-32 font-[family-name:var(--h-sans)] text-[#171717]`}>
      <View />
    </div>
  );
}
