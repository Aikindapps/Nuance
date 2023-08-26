import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { colors } from '../../shared/constants';
import { Helmet } from 'react-helmet';

type PublicationCategoriesMenuProps = {
  publicationHandle?: string;
  displayName: string | undefined;
  categories: Array<string> | undefined;
  selectedCategory?: string;
  color?: string;
  dark?: boolean;
};

const PublicationCategoriesMenu: React.FC<PublicationCategoriesMenuProps> = (
  props
): JSX.Element => {
  const navigate = useNavigate();

  const handleNavigation = (categoryName: string) => {
    if (categoryName === 'Latest') {
      navigate(`/publication/${props.publicationHandle}`);
    } else {
      navigate(
        `/publication/${props.publicationHandle}/${trim_category_name(
          categoryName
        )}`
      );
    }
  };

  const trim_category_name = (name: string) => {
    return name
      .split('')
      .map((char) => {
        if (char === ' ') {
          return '-';
        } else {
          return char.toLowerCase();
        }
      })
      .join('');
  };

  const darkOptionsAndColors = {
    background: props.dark
      ? colors.darkModePrimaryBackgroundColor
      : colors.primaryBackgroundColor,
    color: props.dark
      ? colors.darkModePrimaryTextColor
      : colors.primaryTextColor,
    secondaryColor: props.dark
      ? colors.darkSecondaryTextColor
      : colors.primaryTextColor,
  };

  return (
    <div
      className='categories-wrapper'
      style={{ color: darkOptionsAndColors.color }}
    >
      <div
        onClick={() => {
          handleNavigation('Latest');
        }}
        className='categories-header'
      >
        {props.displayName}
      </div>
      {props.categories?.map((category, index) => {
        const isSelected =
          props.selectedCategory === trim_category_name(category);
        if (props.color) {
          return (
            <div key={index} style={{ color: props.color }}>
              <div
                key={category}
                onClick={() => handleNavigation(category)}
                className={
                  isSelected
                    ? 'category-element-styled selected'
                    : 'category-element-styled'
                }
                style={
                  isSelected
                    ? { color: props.color }
                    : { color: darkOptionsAndColors.color }
                }
              >
                {category}
              </div>
            </div>
          );
        } else {
          return (
            <div
              key={category}
              onClick={() => handleNavigation(category)}
              className={
                isSelected
                  ? 'category-element selected'
                  : props.dark
                  ? 'category-element-dark'
                  : 'category-element'
              }
            >
              {category}
            </div>
          );
        }
      })}
      <div className='horizontal-divider'></div>
    </div>
  );
};

export default PublicationCategoriesMenu;
