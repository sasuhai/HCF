import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "HCF iSantuni",
  description: "Sistem pengurusan data kemasukan mualaf dan anak mualaf Hidayah Centre Foundation",
  metadataBase: new URL('https://hcf-app-1bb1e.web.app'),
  openGraph: {
    title: "HCF iSantuni",
    description: "Sistem pengurusan data kemasukan mualaf dan anak mualaf Hidayah Centre Foundation",
    url: 'https://hcf-app-1bb1e.web.app',
    siteName: 'HCF iSantuni',
    images: [
      {
        url: 'https://hidayahcentre.org.my/wp-content/uploads/2021/06/logo-web2.png',
        width: 800,
        height: 600,
        alt: 'Hidayah Centre Foundation Logo',
      },
    ],
    locale: 'ms_MY',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "HCF iSantuni",
    description: "Sistem pengurusan data kemasukan mualaf dan anak mualaf Hidayah Centre Foundation",
    images: ['https://hidayahcentre.org.my/wp-content/uploads/2021/06/logo-web2.png'],
  },
  icons: {
    icon: 'https://hidayahcentre.org.my/wp-content/uploads/2021/06/logo-web2.png',
    apple: 'https://hidayahcentre.org.my/wp-content/uploads/2021/06/logo-web2.png',
  },
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
