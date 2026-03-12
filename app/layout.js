import "./globals.css";

export const metadata = {
  title: "DinkStat — Pickleball Match Tracker & LP Rankings",
  description: "Track pickleball matches, earn LP, climb the leaderboard.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
