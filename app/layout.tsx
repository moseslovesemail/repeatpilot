import "./globals.css";

export const metadata = {
  title: "RepeatPilot",
  description: "Put repeat revenue on autopilot."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
