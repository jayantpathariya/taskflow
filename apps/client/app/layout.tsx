import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const geistHeading = Geist({subsets:['latin'],variable:'--font-heading'});

const ibmPlexSans = IBM_Plex_Sans({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TaskFlow - Task & Time Tracking",
  description: "Smart task and real-time time tracking dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", ibmPlexSans.variable, geistHeading.variable)}
    >
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster richColors position="top-right" closeButton />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
