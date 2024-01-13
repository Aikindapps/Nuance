import React, { useState, useEffect } from 'react';
import './_login.scss';
import defaultUser from '../../assets/images/aikin.png';
import { useAuthStore } from '../../store/authStore';
import { identity } from 'lodash';

const Login = () => {
    const [showDropdown, setShowDropdown] = useState(false);

    const { isLoggedIn, logout, login, getIdentity, init, principalString, identity } = useAuthStore((state) => ({
        init: state.init,
        isLoggedIn: state.isLoggedIn,
        login: state.login,
        logout: state.logout,
        getIdentity: state.getIdentity,
        principalString: state.principalString,
        identity: state.identity,

    }));

    useEffect(() => {
        init();
    }, [init]);

    const handleLoginLogout = () => {
        if (isLoggedIn) {
            logout();
        } else {
            login("ii");
            getIdentity();
        }
        setShowDropdown(false);
    };

    const toggleDropdown = () => {
        console.log('isLoggedIn', isLoggedIn);
        if (isLoggedIn) {
            setShowDropdown(!showDropdown);
        }
    };

    return (
        <div className="login-container">
            {isLoggedIn ? (
                <div className="user-avatar" onClick={toggleDropdown}>
                    <img src={defaultUser} alt="User Avatar" />
                    <div className={`dropdown ${showDropdown ? 'show' : ''}`}>
                        <div className='user-name'>Principal: </div>
                        <div className="principal-id">{principalString}</div>
                        <button className="logout-button" onClick={handleLoginLogout}>
                            Log Out
                        </button>
                    </div>

                </div>
            ) : (
                <div className='admin-login' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <button className="logout-button" onClick={handleLoginLogout}>
                        Log in
                    </button>
                </div>
            )}
        </div>
    );
};

export default Login;
