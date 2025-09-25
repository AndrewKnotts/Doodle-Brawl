import "./globals.css";
import type { Metadata } from "next";
import { Inter, Indie_Flower, Sour_Gummy } from "next/font/google";

import NavBar from "@/components/NavBar/NavBar";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });
const indieFlower = Indie_Flower({
  weight: "400",
  subsets: ["latin"],
});
const sourGummy = Sour_Gummy({
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Doodle Battle",
  description: "Draw fighters, battle, and climb the leaderboard.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header>
          <NavBar />
        </header>
        <Toaster position="top-right" />
        <main>{children}</main>
      </body>
    </html>
  );
}
