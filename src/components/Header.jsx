import React from 'react';
import { useUser } from '../context/UserContext';
import './Header.css';
import logo from '../assets/logo.png';

const Header = () => {
    const { user, logout } = useUser();

    return (
        <header className="header glass-panel">
            <div className="logo-container">
                <img src={logo} alt="Nir Oz Logo" className="logo-img" />
                <h1>חדר אוכל ניר עוז</h1>
            </div>

            <div className="header-actions">
                {user && (
                    <div className="user-profile">
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="user-avatar" />
                        ) : (
                            <div className="user-avatar-placeholder">{user.name ? user.name.charAt(0) : '?'}</div>
                        )}
                        <span className="user-name">{user.name}</span>
                        <button className="btn-logout" onClick={logout}>התנתק</button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
