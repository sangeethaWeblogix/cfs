import { Metadata } from 'next';
import React from 'react';
import Test from './SentryTestButton';

export const metadata: Metadata = {
  title: {
    default: "Caravans For Sale - Test Page",
    template: "%s ",
  },
  robots: "noindex, nofollow",
};

const test = () => {
  return (
    <div>
      <Test />
    </div>
  );
};

export default test;
