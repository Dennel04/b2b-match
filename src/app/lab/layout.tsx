import { Switcher } from './_Switcher';
import './lab.css';

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Switcher />
    </>
  );
}
