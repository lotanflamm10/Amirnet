import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Rubik } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AppShell } from "@/components/layout/AppShell";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
const rubik   = Rubik({ subsets: ["latin", "hebrew"], variable: "--font-rubik", display: "swap" });

export const metadata: Metadata = {
  title: { default: "AMIRNET Trainer", template: "%s | AMIRNET Trainer" },
  description: "Practice AMIRNET-style English with smart drills, simulations, and swipe vocabulary. Independent tool — not affiliated with NITE.",
  keywords: ["AMIRNET", "AMIRAM", "psychometric", "English", "Israel", "practice", "vocabulary"],
  openGraph: { title: "AMIRNET Trainer", description: "Smart English prep for Israeli students.", type: "website" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning
      className={`${jakarta.variable} ${rubik.variable}`}
      style={{ fontFamily: "var(--font-rubik), system-ui, sans-serif" }}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var s=JSON.parse(localStorage.getItem('amirnet-theme-settings-v1')||'null');var t=(s&&s.mode)||localStorage.getItem('amirnet-theme')||'dark';var e=document.documentElement;e.setAttribute('data-theme',t);if(s&&s.primary&&s.primary!=='#0DCBB1'){var p=s.primary,hx=p.replace('#',''),r=parseInt(hx.slice(0,2),16),g=parseInt(hx.slice(2,4),16),b=parseInt(hx.slice(4,6),16),f=0.9;var dh='#'+[r,g,b].map(function(v){return Math.max(0,Math.round(v*f)).toString(16).padStart(2,'0')}).join('');e.style.setProperty('--teal',p);e.style.setProperty('--teal-h',dh);e.style.setProperty('--teal-sub','rgba('+r+','+g+','+b+',0.10)');e.style.setProperty('--teal-faint','rgba('+r+','+g+','+b+',0.06)');e.style.setProperty('--shadow-teal','0 4px 24px rgba('+r+','+g+','+b+',0.18)');e.style.setProperty('--shadow-btn-primary','0 2px 8px rgba('+r+','+g+','+b+',0.30)');e.style.setProperty('--shadow-btn-primary-hover','0 4px 16px rgba('+r+','+g+','+b+',0.35)');}if(s&&typeof s.bgHue==='number'&&s.bgHue>=0&&s.bgHue<=360){var bh=s.bgHue,dm=t==='dark',hs=function(hu,sat,lig){var hn=hu/360,sn=sat/100,ln=lig/100,q=ln<0.5?ln*(1+sn):ln+sn-ln*sn,pp=2*ln-q,c=function(tt){if(tt<0)tt+=1;if(tt>1)tt-=1;if(tt<1/6)return pp+(q-pp)*6*tt;if(tt<0.5)return q;if(tt<2/3)return pp+(q-pp)*(2/3-tt)*6;return pp;},rv=Math.round(c(hn+1/3)*255),gv=Math.round(c(hn)*255),bv=Math.round(c(hn-1/3)*255);return'#'+[rv,gv,bv].map(function(v){return v.toString(16).padStart(2,'0')}).join('');};e.style.setProperty('--canvas',dm?hs(bh,28,7):hs(bh,60,97));e.style.setProperty('--surface',dm?hs(bh,34,13):hs(bh,20,100));e.style.setProperty('--raised',dm?hs(bh,30,17):hs(bh,55,96));e.style.setProperty('--line',dm?hs(bh,26,20):hs(bh,50,90));}}catch(err){document.documentElement.setAttribute('data-theme',localStorage.getItem('amirnet-theme')||'dark');}})()` }} />
      </head>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <AppShell>{children}</AppShell>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
