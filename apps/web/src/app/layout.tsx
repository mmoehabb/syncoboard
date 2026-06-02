import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Syncoboard | Code-First Coordination",
  description:
    "Your board, on autopilot. Stop updating tickets. Just push code.",
};

import { CommandProvider } from "../context/CommandContext";
import { ToastProvider } from "../context/ToastContext";
import { CommandBar } from "../components/CommandBar";
import { Cursor } from "../components/Cursor";
import { DeleteConfirmationModal } from "../components/modals/DeleteConfirmationModal";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetBrainsMono.variable} dark`}
    >
      <head>
        <meta name="apple-mobile-web-app-title" content="Syncoboard" />
      </head>
      <body className="antialiased min-h-screen flex flex-col relative">
        <Cursor />
        <ToastProvider>
          <CommandProvider>
            {children}
            <CommandBar />
            <DeleteConfirmationModal />
          </CommandProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
