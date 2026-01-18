import React, { useState } from 'react';
import Header from './components/Header';
import CalendarBoard from './components/CalendarBoard';
// import MenuBoard from './components/MenuBoard'; // Kept for reference or removing if not needed. Let's comment out.
import CartModal from './components/CartModal';
import LoginModal from './components/LoginModal';
import { UserProvider, useUser } from './context/UserContext';
import './App.css';
import AdminDashboard from './components/AdminDashboard'; // Add import

function MainContent() {
  const { user, isCompletingProfile } = useUser();

  // Show modal if not logged in OR is completing profile
  const showLoginModal = !user || isCompletingProfile;

  // Role Based Rendering
  const isAdmin = user?.role === 'admin';
  console.log('Current User:', user);
  console.log('Is Admin:', isAdmin);

  return (
    <div className="app-layout">
      {showLoginModal && <LoginModal isCompletingProfile={isCompletingProfile} />}
      {/* {user && !isCompletingProfile && cartIsShown && <CartModal onClose={hideCartHandler} />} */}
      <Header />
      <main className="main-content">
        {isAdmin ? <AdminDashboard /> : <CalendarBoard />}
      </main>
    </div>
  );
}

function App() {
  return (
    <UserProvider>
      <MainContent />
    </UserProvider>
  );
}

export default App;
