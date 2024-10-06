import React, { CSSProperties, useEffect } from 'react';

interface HeaderImageProps {
  src: string;
  style: CSSProperties;
}

const HeaderImage: React.FC<HeaderImageProps> = ({ src, style }) => {
    useEffect(() => {
        if (src) {
            const headerImage = src;
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = headerImage;
            link.as = 'image';

            document.head.appendChild(link);

            return () => {
            document.head.removeChild(link);
            };
        }
    }, [src]);

  return (
    <img className='header-image' src={src} loading='eager' style={style} />
  );
};

export default HeaderImage;
