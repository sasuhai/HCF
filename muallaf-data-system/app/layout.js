import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Sistem Data Kemasukan Mualaf",
  description: "Sistem pengurusan data kemasukan mualaf dan anak mualaf",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ms">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
