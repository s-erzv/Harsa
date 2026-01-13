import { Raleway } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Script from "next/script";
import { Toaster } from 'sonner' 

const raleway = Raleway({ subsets: ["latin"], variable: "--font-raleway" });

export const metadata = {
  title: "Harsa | Decentralized Sourcing Protocol",
  description: "Global decentralized supply chain node for agricultural trade and instant settlements on Arbitrum L2.",
  icons: {
    icon: "/light.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${raleway.variable} font-raleway antialiased bg-white text-stone selection:bg-forest selection:text-white`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        
        <Toaster 
          position="top-center" 
          expand={false} 
          richColors 
          closeButton
          toastOptions={{
            style: { 
              borderRadius: '1.5rem',
              fontFamily: 'var(--font-raleway)',
              border: '1px solid #FAEDCD' 
            },
          }}
        />

        <Script 
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places&loading=async`}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}