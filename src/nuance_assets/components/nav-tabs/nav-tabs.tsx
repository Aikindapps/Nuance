import React, { MouseEventHandler, useRef, useLayoutEffect } from 'react';
import './_nav-tabs.scss';
import { Nav } from 'react-bootstrap';
import { useTheme } from '../../contextes/ThemeContext';

type NavTabProps = {
  firstTab: string;
  secondTab: string;
  thirdTab: string;
  fourthTab: string;
  fifthTab: string;
  onClick1: MouseEventHandler<HTMLDivElement>;
  onClick2: MouseEventHandler<HTMLDivElement>;
  onClick3: MouseEventHandler<HTMLDivElement>;
  onClick4: MouseEventHandler<HTMLDivElement>;
  onClick5: MouseEventHandler<HTMLDivElement>;
  tagSearched: boolean;
};

const NavTabs: React.FC<NavTabProps> = ({
  firstTab,
  secondTab,
  thirdTab,
  fourthTab,
  fifthTab,
  onClick1,
  onClick2,
  onClick3,
  onClick4,
  onClick5,
  tagSearched,
}): JSX.Element => {
  const darkTheme = useTheme();

  return (
    <Nav
      className={darkTheme ? 'dark' : ''}
      variant='tabs'
      defaultActiveKey={tagSearched ? 'link-5' : 'link-3'}
    >
      {firstTab != '' ? (
        <Nav.Item className={darkTheme ? 'dark' : ''} onClick={onClick1}>
          <Nav.Link className={darkTheme ? 'dark' : ''} eventKey='link-1'>
            {firstTab}
          </Nav.Link>
        </Nav.Item>
      ) : null}
      {secondTab != '' ? (
        <Nav.Item className={darkTheme ? 'dark' : ''} onClick={onClick2}>
          <Nav.Link className={darkTheme ? 'dark' : ''} eventKey='link-2'>
            {secondTab}
          </Nav.Link>
        </Nav.Item>
      ) : null}
      {thirdTab != '' ? (
        <Nav.Item className={darkTheme ? 'dark' : ''} onClick={onClick3}>
          <Nav.Link className={darkTheme ? 'dark' : ''} eventKey='link-3'>
            {thirdTab}
          </Nav.Link>
        </Nav.Item>
      ) : null}
      {fourthTab != '' ? (
        <Nav.Item className={darkTheme ? 'dark' : ''} onClick={onClick4}>
          <Nav.Link className={darkTheme ? 'dark' : ''} eventKey='link-4'>
            {fourthTab}
          </Nav.Link>
        </Nav.Item>
      ) : null}
      {fifthTab != '' ? (
        <Nav.Item className={darkTheme ? 'dark' : ''} onClick={onClick5}>
          <Nav.Link className={darkTheme ? 'dark' : ''} eventKey='link-5'>
            {fifthTab}
          </Nav.Link>
        </Nav.Item>
      ) : null}
    </Nav>
  );
};

export default NavTabs;
