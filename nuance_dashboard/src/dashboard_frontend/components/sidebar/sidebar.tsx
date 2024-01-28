import React, { useContext, useState } from 'react';
import './_sidebar.scss';
import logo from '../../assets/images/icons/nuance-logo.svg';
import { BsGraphUpArrow } from 'react-icons/bs';
import { CiFlag1 } from 'react-icons/ci';
import { BiSolidCylinder } from 'react-icons/bi';
import { IoCreateSharp } from 'react-icons/io5';
import { MdOutlineHowToVote } from 'react-icons/md';
import { FaPerson } from 'react-icons/fa6';

import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { Context as ModalContext } from '../../contextes/ModalContext';
import toast from 'react-hot-toast';
import { toastSuccess } from '../../services/toastService';

const Sidebar = () => {
  const modalContext = useContext(ModalContext);

  const getActiveIcon = () => {
    if (window.location.pathname === '/home') {
      return 'home';
    } else if (window.location.pathname === '/cycles') {
      return 'cycles';
    } else if (window.location.pathname === '/review-comments') {
      return 'review-comments';
    } else if (window.location.pathname === '/metrics') {
      return 'metrics';
    } else if (window.location.pathname === '/actions') {
      return 'actions';
    } else if (window.location.pathname === '/proposals') {
      return 'proposals';
    } else if (window.location.pathname === '/modclub') {
      return 'modclub';
    }
    return 'home';
  };

  const [activeIcon, setActiveIcon] = useState(getActiveIcon());

  const {
    isLoggedIn,
    logout,
    login,
    getIdentity,
    init,
    principalString,
    identity,
  } = useAuthStore((state) => ({
    init: state.init,
    isLoggedIn: state.isLoggedIn,
    login: state.login,
    logout: state.logout,
    getIdentity: state.getIdentity,
    principalString: state.principalString,
    identity: state.identity,
  }));

  return (
    <aside className='sidebar'>
      <div className='logo-container' onClick={() => setActiveIcon('home')}>
        <Link to='/' className='logo'>
          <img
            src={logo}
            alt='Nuance'
            className={activeIcon === 'home' ? 'active' : ''}
          />
        </Link>
      </div>
      {isLoggedIn ? (
        <div className='icon-container'>
          <Link
            to='/review-comments'
            className={`icon ${
              activeIcon === 'review-comments' ? 'active' : ''
            }`}
            onClick={() => setActiveIcon('review-comments')}
          >
            <CiFlag1 />
          </Link>
          <Link
            to='/metrics'
            className={`icon ${activeIcon === 'metrics' ? 'active' : ''}`}
            onClick={() => setActiveIcon('metrics')}
          >
            <BsGraphUpArrow />
          </Link>
          <Link
            to='/cycles'
            className={`icon ${activeIcon === 'cycles' ? 'active' : ''}`}
            onClick={() => setActiveIcon('cycles')}
          >
            <BiSolidCylinder />
          </Link>
          <Link
            to='/actions'
            className={`icon ${activeIcon === 'actions' ? 'active' : ''}`}
            onClick={() => setActiveIcon('actions')}
          >
            <IoCreateSharp />
          </Link>
          <Link
            to='/proposals'
            className={`icon ${activeIcon === 'proposals' ? 'active' : ''}`}
            onClick={() => setActiveIcon('proposals')}
          >
            <MdOutlineHowToVote />
          </Link>
          <Link
            to='/modclub'
            className={`icon ${activeIcon === 'modclub' ? 'active' : ''}`}
            onClick={() => setActiveIcon('modclub')}
          >
            <FaPerson />
          </Link>
        </div>
      ) : (
        <button
          type='submit'
          onClick={() => {
            modalContext?.openModal('Login');
          }}
        >
          Login
        </button>
      )}
      {isLoggedIn && (
        <button
          type='submit'
          onClick={() => {
            navigator.clipboard.writeText(principalString);
            toastSuccess('Copied to clipboard!');
          }}
        >
          Copy your principal
        </button>
      )}
      {isLoggedIn && (
        <button
          type='submit'
          onClick={() => {
            logout();
          }}
        >
          Log out
        </button>
      )}
    </aside>
  );
};

export default Sidebar;
