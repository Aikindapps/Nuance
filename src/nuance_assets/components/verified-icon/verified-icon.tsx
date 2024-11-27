import React from 'react';

export const GradientMdVerified = (props: {
    width: string,
    height: string
}) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      width={props.width} // Adjust size as needed
      height={props.height}
    >
      <defs>
        <linearGradient id='verifiedGradient' gradientTransform='rotate(90)'>
          <stop offset='0%' stopColor='#1FDCBD' />
          <stop offset='100%' stopColor='#23F295' />
        </linearGradient>
      </defs>
      <path
        fill='url(#verifiedGradient)'
        d='M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z'
      />
    </svg>
  );
};

export default GradientMdVerified;
