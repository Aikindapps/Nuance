import React, { useContext, useState } from 'react';
import './_sidebar.scss';
import logo from '../../assets/images/icons/nuance-logo.svg';
import metrics from '../../assets/images/icons/metrics.svg';
import reviewComments from '../../assets/images/icons/review-comments.svg';
import cycles from '../../assets/images/icons/cycles.svg';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { Context as ModalContext } from '../../contextes/ModalContext';

const Sidebar = () => {
  const modalContext = useContext(ModalContext);

  const [activeIcon, setActiveIcon] = useState('home');

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
            <img src={reviewComments} alt='Review Comments' />
          </Link>
          <Link
            to='/metrics'
            className={`icon ${activeIcon === 'metrics' ? 'active' : ''}`}
            onClick={() => setActiveIcon('metrics')}
          >
            <img src={metrics} alt='Metrics' />
          </Link>
          <Link
            to='/cycles'
            className={`icon ${activeIcon === 'cycles' ? 'active' : ''}`}
            onClick={() => setActiveIcon('cycles')}
          >
            <img src={cycles} alt='Cycles' />
          </Link>
        </div>
      ) : (
        <button type='submit' onClick={() => {
            modalContext?.openModal('Login');
        }}>
          Login
        </button>
      )}
    </aside>
  );
};

export default Sidebar;
