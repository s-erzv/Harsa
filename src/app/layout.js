import { Raleway } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const raleway = Raleway({ subsets: ["latin"] });

export const metadata = {
  title: "Harsa - Keadilan untuk Petani",
  description: "Marketplace Terdesentralisasi",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={raleway.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}