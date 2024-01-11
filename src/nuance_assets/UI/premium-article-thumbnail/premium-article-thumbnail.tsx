import React from 'react';
import { PostType } from '../../types/types';
import { useUserStore } from '../../store';
type PremiumArticleThumbnailProps = {
  post: PostType;
  handle: string
};
const PremiumArticleThumbnail: React.FC<PremiumArticleThumbnailProps> = ({
  post,
  handle
}) => {

  function getTitleTexts(): string[] {
    let title = post.title;
    if (title.length <= 35) {
      return [title];
    } else {
      const words = title.split(' ');
      let firstLine = '';
      let secondLine = '';
      let isFirstLineAllowed = true;
      let isSecondLineAllowed = true;
      for (const word of words) {
        if (firstLine.length + word.length < 34 && isFirstLineAllowed) {
          firstLine += ` ${word}`;
        } else {
          isFirstLineAllowed = false;
          if (secondLine.length + word.length < 31 && isSecondLineAllowed) {
            secondLine += ` ${word}`;
          } else if (isSecondLineAllowed) {
            secondLine += '...';
            isSecondLineAllowed = false;
          }
        }
      }
      return [firstLine, secondLine];
    }
  }

  function getSubtitleTexts(): string[] {
    let subtitle = post.subtitle;
    let result = [];
    if (subtitle.length <= 55) {
      return [subtitle];
    } else {
      const words = subtitle.split(' ');
      let firstLine = '',
        secondLine = '',
        thirdLine = '';
      let isFirstLineAllowed = true,
        isSecondLineAllowed = true,
        isThirdLineAllowed = true;
      for (const word of words) {
        if (firstLine.length + word.length < 55 && isFirstLineAllowed) {
          firstLine += ` ${word}`;
        } else {
          isFirstLineAllowed = false;
          if (secondLine.length + word.length < 55 && isSecondLineAllowed) {
            secondLine += ` ${word}`;
          } else {
            isSecondLineAllowed = false;
            if (thirdLine.length + word.length < 52 && isThirdLineAllowed) {
              thirdLine += ` ${word}`;
            } else if (isThirdLineAllowed) {
              thirdLine += '...';
              isThirdLineAllowed = false;
            }
          }
        }
      }
      return [firstLine, secondLine, thirdLine];
    }
  }
  return (
    <svg
      style={{ minHeight: '150px', maxWidth: '250px', maxHeight:'250px' }}
      width={659}
      height={709}
      viewBox='0 0 659 709'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      xmlnsXlink='http://www.w3.org/1999/xlink'
    >
      <rect
        x={537}
        y={590}
        width={120}
        height={117}
        stroke='url(#paint0_linear_3082_8737)'
        strokeWidth={4}
      />
      <rect
        x={546}
        y={490}
        width={78}
        height={76}
        stroke='url(#paint1_linear_3082_8737)'
        strokeWidth={4}
      />
      <rect
        x={439}
        y={617}
        width={53}
        height={52}
        stroke='url(#paint2_linear_3082_8737)'
        strokeWidth={4}
      />
      <g filter='url(#filter0_f_3082_8737)'>
        <path
          d='M12.6851 36.6133L39.8735 12.4457C43.2327 9.4598 48.3918 9.8263 51.2952 13.2571L584.424 643.229C587.773 647.186 586.531 653.234 581.895 655.553L542.689 675.155C541.578 675.711 540.353 676 539.111 676H18C13.5817 676 10 672.418 10 668V42.5925C10 40.3074 10.9772 38.1314 12.6851 36.6133Z'
          fill='url(#paint3_linear_3082_8737)'
        />
      </g>
      <g filter='url(#filter1_d_3082_8737)'>
        <rect
          x={54.8281}
          y={14.7103}
          width={534.952}
          height={630.29}
          fill='white'
        />
      </g>
      <g filter='url(#filter2_d_3082_8737)'>
        <rect
          x={50.4141}
          y={10.2966}
          width={534.952}
          height={630.29}
          fill='white'
        />
      </g>
      <g filter='url(#filter3_d_3082_8737)'>
        <rect x={46} y={5} width={534.952} height={630.29} fill='#151451' />
      </g>
      <path
        d='M46 11C46 7.68628 48.6863 5 52 5H581V334H46V11Z'
        fill='url(#pattern0)'
      />
      <rect
        x={571}
        y={288}
        width={10}
        height={140}
        fill='url(#paint4_linear_3082_8737)'
      />
      <rect x={79} y={305.138} width={29.131} height={29.131} fill='#151451' />
      <rect
        x={86.2002}
        y={312.972}
        width={14.5655}
        height={1.82069}
        fill='#D9D9D9'
      />
      <rect
        x={86.2002}
        y={318.434}
        width={14.5655}
        height={1.82069}
        fill='#D9D9D9'
      />
      <rect
        x={86.2002}
        y={323.897}
        width={7.28276}
        height={1.82069}
        fill='#D9D9D9'
      />
      <path
        d='M581 635.405C406.5 635.405 60.9419 635.5 51.5005 635.5C41.6582 635.5 46.5 648 59.2338 648H590'
        stroke='#151451'
      />
      <g
        style={{
          mixBlendMode: 'multiply',
        }}
      >
        <rect
          x={46}
          y={4}
          width={22}
          height={631}
          fill='url(#paint5_linear_3082_8737)'
        />
      </g>
      <path
        opacity={0.4}
        d='M100 4H551L492.29 312L444.827 561L100 633V4Z'
        fill='url(#paint6_linear_3082_8737)'
      />
      {getTitleTexts().map((t, index) => {
        return (
          <text
            key={index}
            opacity={0.9}
            x={80}
            y={380 + index * 35}
            fontSize={28}
            fontFamily='Georgia'
            fontStyle='normal'
            fontWeight={400}
            line-height='30px'
            fill='#ffffff'
          >
            {t}
          </text>
        );
      })}
      {getSubtitleTexts().map((t, index) => {
        return (
          <text
            key={index}
            opacity={0.9}
            x={80}
            y={470 + index * 25}
            fontSize={19.4}
            fontFamily='Georgia'
            fontStyle='normal'
            fontWeight={400}
            line-height='28px'
            fill='#B2B2B2'
          >
            {t}
          </text>
        );
      })}
      <text
        x='80'
        y='612'
        font-size='21.4'
        font-family='Arial'
        font-style='normal'
        font-weight='700'
        line-height='21px'
        fill='white'
      >
        {'@' + handle}
      </text>
      <defs>
        <filter
          id='filter0_f_3082_8737'
          x={0}
          y={0.424896}
          width={596.318}
          height={685.575}
          filterUnits='userSpaceOnUse'
          colorInterpolationFilters='sRGB'
        >
          <feFlood floodOpacity={0} result='BackgroundImageFix' />
          <feBlend
            mode='normal'
            in='SourceGraphic'
            in2='BackgroundImageFix'
            result='shape'
          />
          <feGaussianBlur
            stdDeviation={5}
            result='effect1_foregroundBlur_3082_8737'
          />
        </filter>
        <filter
          id='filter1_d_3082_8737'
          x={51.2971}
          y={14.7103}
          width={542.014}
          height={637.352}
          filterUnits='userSpaceOnUse'
          colorInterpolationFilters='sRGB'
        >
          <feFlood floodOpacity={0} result='BackgroundImageFix' />
          <feColorMatrix
            in='SourceAlpha'
            type='matrix'
            values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0'
            result='hardAlpha'
          />
          <feOffset dy={3.53103} />
          <feGaussianBlur stdDeviation={1.76552} />
          <feComposite in2='hardAlpha' operator='out' />
          <feColorMatrix
            type='matrix'
            values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0'
          />
          <feBlend
            mode='normal'
            in2='BackgroundImageFix'
            result='effect1_dropShadow_3082_8737'
          />
          <feBlend
            mode='normal'
            in='SourceGraphic'
            in2='effect1_dropShadow_3082_8737'
            result='shape'
          />
        </filter>
        <filter
          id='filter2_d_3082_8737'
          x={46.883}
          y={10.2966}
          width={542.014}
          height={637.352}
          filterUnits='userSpaceOnUse'
          colorInterpolationFilters='sRGB'
        >
          <feFlood floodOpacity={0} result='BackgroundImageFix' />
          <feColorMatrix
            in='SourceAlpha'
            type='matrix'
            values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0'
            result='hardAlpha'
          />
          <feOffset dy={3.53103} />
          <feGaussianBlur stdDeviation={1.76552} />
          <feComposite in2='hardAlpha' operator='out' />
          <feColorMatrix
            type='matrix'
            values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0'
          />
          <feBlend
            mode='normal'
            in2='BackgroundImageFix'
            result='effect1_dropShadow_3082_8737'
          />
          <feBlend
            mode='normal'
            in='SourceGraphic'
            in2='effect1_dropShadow_3082_8737'
            result='shape'
          />
        </filter>
        <filter
          id='filter3_d_3082_8737'
          x={42.469}
          y={5}
          width={542.014}
          height={637.352}
          filterUnits='userSpaceOnUse'
          colorInterpolationFilters='sRGB'
        >
          <feFlood floodOpacity={0} result='BackgroundImageFix' />
          <feColorMatrix
            in='SourceAlpha'
            type='matrix'
            values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0'
            result='hardAlpha'
          />
          <feOffset dy={3.53103} />
          <feGaussianBlur stdDeviation={1.76552} />
          <feComposite in2='hardAlpha' operator='out' />
          <feColorMatrix
            type='matrix'
            values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0'
          />
          <feBlend
            mode='normal'
            in2='BackgroundImageFix'
            result='effect1_dropShadow_3082_8737'
          />
          <feBlend
            mode='normal'
            in='SourceGraphic'
            in2='effect1_dropShadow_3082_8737'
            result='shape'
          />
        </filter>
        <pattern
          id='pattern0'
          patternContentUnits='objectBoundingBox'
          width={1}
          height={1}
        >
          <use
            xlinkHref='#image0_3082_8737'
            transform='matrix(0.00191574 0 0 0.00311526 -0.0862171 0)'
          />
        </pattern>
        <linearGradient
          id='paint0_linear_3082_8737'
          x1={597}
          y1={588}
          x2={597}
          y2={709}
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='#25F68D' />
          <stop offset={1} stopColor='#1BC0F2' />
        </linearGradient>
        <linearGradient
          id='paint1_linear_3082_8737'
          x1={585}
          y1={488}
          x2={585}
          y2={568}
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='#25F68D' />
          <stop offset={1} stopColor='#1BC0F2' />
        </linearGradient>
        <linearGradient
          id='paint2_linear_3082_8737'
          x1={465.5}
          y1={615}
          x2={465.5}
          y2={671}
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='#25F68D' />
          <stop offset={1} stopColor='#1BC0F2' />
        </linearGradient>
        <linearGradient
          id='paint3_linear_3082_8737'
          x1={409}
          y1={273}
          x2={105}
          y2={676}
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='#D9D9D9' />
          <stop offset={1} stopColor='#CDCDCD' stopOpacity={0.24} />
        </linearGradient>
        <linearGradient
          id='paint4_linear_3082_8737'
          x1={576}
          y1={288}
          x2={576}
          y2={428}
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='#25F68D' />
          <stop offset={1} stopColor='#1BC0F2' />
        </linearGradient>
        <linearGradient
          id='paint5_linear_3082_8737'
          x1={68}
          y1={219}
          x2={38.6667}
          y2={219}
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='#D9D9D9' stopOpacity={0} />
          <stop offset={0.489583} stopColor='#C6C6C6' />
          <stop offset={1} stopColor='#D9D9D9' stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id='paint6_linear_3082_8737'
          x1={522.408}
          y1={-206.236}
          x2={54.9074}
          y2={157.836}
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='white' />
          <stop offset={0.515625} stopColor='white' stopOpacity={0.671875} />
          <stop offset={1} stopColor='white' stopOpacity={0} />
        </linearGradient>
        <image
          id='image0_3082_8737'
          width={612}
          height={321}
          xlinkHref={post.headerImage}
        />
      </defs>
    </svg>
  );
};

export default PremiumArticleThumbnail;
