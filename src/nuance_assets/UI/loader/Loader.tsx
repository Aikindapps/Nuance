import React from 'react';
import { images } from '../../shared/constants';
import { useTheme } from '../../contextes/ThemeContext';

const Loader = () => {
  const darkTheme = useTheme();

  return (
    <img
      src={
        darkTheme
          ? images.loaders.NUANCE_LOADER_DARK
          : images.loaders.NUANCE_LOADER
      }
      alt='Aikin loading image'
    />
  );
};

export default Loader;
