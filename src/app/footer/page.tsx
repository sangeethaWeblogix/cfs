// export const dynamic = "force-dynamic"
;

import React, { Suspense } from "react";
import Footer from "./Footer";

const page = () => {
  return (
   <Suspense fallback={null}>
        <Footer />
      </Suspense>
  );
};

export default page;
