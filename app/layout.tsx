import type { Metadata } from "next"; // Importing the Metadata type from Next.js
import "./globals.css"; // Importing global CSS styles

export const metadata: Metadata = {
  title: "Insight Hub",
  description: "Your go-to destination for compelling insights and stories",
};

// RootLayout component that wraps the entire application
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode; // Type definition for children prop
}>) {
  return (
    <html lang="en">
      {/* Setting the language attribute for the HTML document */}
      <head>
        {/* Official Lytics JavaScript Tag - Exact implementation from docs */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(){"use strict";var o=window.jstag||(window.jstag={}),r=[];function n(e){o[e]=function(){for(var n=arguments.length,t=new Array(n),i=0;i<n;i++)t[i]=arguments[i];r.push([e,t])}}n("send"),n("mock"),n("identify"),n("pageView"),n("unblock"),n("getid"),n("setid"),n("loadEntity"),n("getEntity"),n("on"),n("once"),n("call"),o.loadScript=function(n,t,i){var e=document.createElement("script");e.async=!0,e.src=n,e.onload=t,e.onerror=i;var o=document.getElementsByTagName("script")[0],r=o&&o.parentNode||document.head||document.body,c=o||r.lastChild;return null!=c?r.insertBefore(e,c):r.appendChild(e),this},o.init=function n(t){return this.config=t,this.loadScript(t.src,function(){if(o.init===n)throw new Error("Load error!");o.init(o.config),function(){for(var n=0;n<r.length;n++){var t=r[n][0],i=r[n][1];o[t].apply(o,i)}r=void 0}()}),this}}();
              
              // Initialize with your account ID
              jstag.init({
                src: 'https://c.lytics.io/api/tag/880b1840768b4b500cd86076f03fff3f/latest.min.js'
              });
              
              // Send a safe page view with only essential data
              setTimeout(function() {
                try {
                  jstag('send', 'pageview', {
                    url: window.location.href,
                    title: document.title,
                    path: window.location.pathname,
                    timestamp: new Date().toISOString()
                  });
                } catch (e) {
                  // Fallback to basic pageview if there are any serialization issues
                  jstag.pageView();
                }
              }, 100);
            `
          }}
        />
      </head>
      <body>
        {children}
      </body>
      {/* Rendering the children components inside the body */}
    </html>
  );
}
