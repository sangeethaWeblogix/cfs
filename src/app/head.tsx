 export default function Head() {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const gtmServer = process.env.NEXT_PUBLIC_GTM_SERVER_URL;

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          window.dataLayer = window.dataLayer || [];
          (function(w,d,s,l,i){
            w[l]=w[l]||[];
            w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
            var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),
                dl=l!='dataLayer'?'&l='+l:'';
            j.async=true;
            j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl+
                  '&gtm_url=${gtmServer}';
            f?f.parentNode.insertBefore(j,f):document.head.appendChild(j);
          })(window,document,'script','dataLayer','${gtmId}');
        `,
      }}
    />
  );
}
