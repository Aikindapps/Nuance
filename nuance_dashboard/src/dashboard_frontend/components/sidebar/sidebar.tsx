import React, { useState } from 'react';
import './_sidebar.scss';
import logo from '../../assets/images/icons/nuance-logo.svg';
import metrics from '../../assets/images/icons/metrics.svg';
import reviewComments from '../../assets/images/icons/review-comments.svg';
import cycles from '../../assets/images/icons/cycles.svg';
import { Link } from 'react-router-dom';

const Sidebar = () => {
    const [activeIcon, setActiveIcon] = useState('home');

    return (
        <aside className="sidebar">
            <div className="logo-container" onClick={() => setActiveIcon('home')}>
                <Link to="/" className="logo">
                    <img src={logo} alt="Nuance" className={activeIcon === 'home' ? 'active' : ''} />
                </Link>
            </div>
            <div className="icon-container">
                <Link to="/review-comments" className={`icon ${activeIcon === 'review-comments' ? 'active' : ''}`} onClick={() => setActiveIcon('review-comments')}>
                    <img src={reviewComments} alt="Review Comments" />
                </Link>
                <Link to="/metrics" className={`icon ${activeIcon === 'metrics' ? 'active' : ''}`} onClick={() => setActiveIcon('metrics')}>
                    <img src={metrics} alt="Metrics" />
                </Link>
                <Link to="/cycles" className={`icon ${activeIcon === 'cycles' ? 'active' : ''}`} onClick={() => setActiveIcon('cycles')}>
                    <img src={cycles} alt="Cycles" />
                </Link>
            </div>
        </aside>
    );
}

export default Sidebar;
