import { Raleway } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Script from "next/script";

const raleway = Raleway({ subsets: ["latin"], variable: "--font-raleway" });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${raleway.variable} font-sans`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Script 
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places&loading=async`}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}