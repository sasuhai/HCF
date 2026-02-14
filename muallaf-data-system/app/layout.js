import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "HCF iSantuni",
  description: "Sistem pengurusan data kemasukan mualaf dan anak mualaf Hidayah Centre Foundation",
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
