import React, { useState, useRef } from 'react';
import { useUser } from '../context/UserContext';
import './LoginModal.css';
import logo from '../assets/logo.png'; // Add import
import googleLogo from '../assets/google-logo.jpg'; // Add import

const LoginModal = ({ isCompletingProfile }) => {
    const { user, login, loginWithGoogle, updateUser, loginTestUser } = useUser();
    const [error, setError] = useState(null);
    const nameRef = useRef();


    // Pre-fill name if completing profile
    React.useEffect(() => {
        if (isCompletingProfile && user && nameRef.current) {
            nameRef.current.value = user.name || '';
        }
    }, [isCompletingProfile, user]);

    const submitHandler = (e) => {
        e.preventDefault();
        const enteredName = nameRef.current.value;

        if (enteredName.trim().length === 0) {
            setError('Please enter a valid nickname.');
            return;
        }

        if (isCompletingProfile) {
            updateUser({ name: enteredName });
        } else {
            login(enteredName); // Login now only takes name, table defaults to '0' or can be removed
        }
    };

    return (
        <div className="login-backdrop">
            <div className="login-modal glass-panel" dir="rtl">
                <img src={logo} alt="Nir Oz Logo" style={{ height: '80px', marginBottom: '1rem' }} />
                <h2>ברוכים הבאים לחדר אוכל ניר עוז</h2>
                {isCompletingProfile ? (
                    <form onSubmit={submitHandler} style={{ width: '100%' }}>
                        <p>אנא אמת את שמך לתצוגה:</p>
                        <input
                            type="text"
                            ref={nameRef}
                            placeholder="הכנס שם מלא / כינוי"
                            className="login-input"
                            defaultValue={user?.name || ''}
                            style={{ width: '100%', padding: '10px', fontSize: '1rem', marginBottom: '15px' }}
                        />
                        <button type="submit" className="login-btn" style={{ width: '100%', padding: '10px', fontSize: '1rem', cursor: 'pointer' }}>
                            שמור והמשך
                        </button>
                    </form>
                ) : (
                    <>
                        <p>אנא התחבר עם חשבון גוגל כדי להזמין.</p>

                        <button className="btn-google" onClick={loginWithGoogle}>
                            <img src={googleLogo} alt="Google" style={{ width: '24px', height: '24px', marginLeft: '10px', borderRadius: '50%' }} />
                            התחברות עם גוגל
                        </button>
                    </>
                )}

                {error && <p className="error-text">{error}</p>}


                {isCompletingProfile && (
                    <button type="button" className="btn-text" onClick={() => window.location.reload()} style={{ marginTop: '10px', fontSize: '0.9rem', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                        ביטול / התנתק
                    </button>
                )}

                {/* Test User Buttons (Dev Only) */}
                {!isCompletingProfile && (
                    <div style={{ marginTop: '2rem', borderTop: '1px solid #ddd', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <p style={{ fontSize: '0.8rem', color: '#666' }}>כניסה לבדיקה (Test Logins):</p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button onClick={() => loginTestUser('admin')} style={{ padding: '5px 10px', cursor: 'pointer', fontSize: '0.8rem' }}>מנהל כללי</button>
                            <button onClick={() => loginTestUser('group_order')} style={{ padding: '5px 10px', cursor: 'pointer', fontSize: '0.8rem' }}>מנהל ענף</button>
                            <button onClick={() => loginTestUser('user')} style={{ padding: '5px 10px', cursor: 'pointer', fontSize: '0.8rem' }}>משתמש</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginModal;
