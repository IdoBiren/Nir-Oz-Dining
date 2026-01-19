/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const UserContext = createContext({
    user: null, // { name: '' }
    login: () => { },
    updateUser: () => { },
    logout: () => { },
});



export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null); // { name: 'John', email: '...', avatar: '...' }
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCompletingProfile, setIsCompletingProfile] = useState(false);

    // Check for active session on load
    useEffect(() => {
        let mounted = true;

        // 0. Synchronous Check: if no token, stop loading immediately
        const tokenKey = 'sb-qylehpuzpcftfzslktrz-auth-token'; // Check chrome dev tools for your specific key if this fails
        // Actually, Supabase uses a key based on project ID.
        // Inspecting local storage is best, but we can also check if *any* supabase key exists or just default to wait 300ms?
        // Better: We check if `localStorage` has any key starting with `sb-` and ending with `-auth-token`?
        // Simpler: Just rely on onAuthStateChange but we can "guess" empty.

        // For now, let's try to be smart. If local storage is empty of auth tokens, we are likely not logged in.
        const hasSupabaseToken = Object.keys(localStorage).some(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
        if (!hasSupabaseToken) {
            console.log('No Supabase token found. Skipping wait.');
            setIsLoading(false);
            // We don't return here because we still want the listener to attach just in case
        }

        // Failsafe: If Supabase takes too long, stop loading
        const timeoutId = setTimeout(() => {
            if (mounted && isLoading) {
                console.warn('Supabase session load timed out. Forcing app load.');
                // User requested no alert on initial load, just logout/fallback
                supabase.auth.signOut().catch(err => console.error('SignOut error during failsafe:', err));
                setIsLoading(false);
            }
        }, 12000);

        // Helper to fetch role AND sync name
        const syncUser = async (email, fullName) => {
            if (!email) return { role: 'user', name: null };

            console.log(`Checking role for: ${email}`);

            try {
                // 1. Try to get existing role
                const { data, error } = await supabase
                    .from('user_roles')
                    .select('role, name')
                    .eq('user_email', email)
                    .single();

                // Force Admin for Debugging
                if (email === 'idobi.renboim.ido@gmail.com') {
                    return { role: 'admin', name: data?.name || fullName };
                }

                // 2. If user exists
                if (data) {
                    return { role: data.role, name: data.name, isNew: !data.name };
                }

                // 3. If user NOT found...
                if (error) {
                    if (error.code === 'PGRST116') { // Not found
                        console.log('User not found, creating new entry...');
                        // Insert. We set name to NULL initially so we can ask for it?
                        // Or we set it, but flag isNew=true.
                        // User request: "ask for user name".
                        // Strategy: We won't insert the name yet? Or we insert it but still ask?
                        // Let's insert Google name as default but flag isNew.
                        await supabase.from('user_roles').insert({ user_email: email, role: 'user', name: fullName });
                        return { role: 'user', name: fullName, isNew: true };
                    }
                    console.warn('Error fetching role:', error.message);
                    return { role: 'user', name: null };
                }
                return { role: data?.role || 'user', name: data?.name };
            } catch (err) {
                console.error('Unexpected error fetching role:', err);
                return { role: 'user', name: null };
            }
        };

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return;
            console.log('UserContext: Auth State Changed:', _event);

            try {
                setSession(session);
                if (session?.user) {
                    const googleName = session.user.user_metadata.full_name || session.user.email.split('@')[0];
                    const cacheKey = `user_role_${session.user.email}`;

                    // 1. OPTIMISTIC CACHE CHECK
                    const cachedRole = localStorage.getItem(cacheKey);
                    const cachedName = localStorage.getItem(`${cacheKey}_name`);

                    if (cachedRole) {
                        console.log('UserContext: Using cached role:', cachedRole);
                        if (mounted) {
                            setUser({
                                id: session.user.id,
                                name: cachedName || googleName,
                                email: session.user.email,
                                avatar: session.user.user_metadata.avatar_url,
                                role: cachedRole
                            });
                            setIsLoading(false); // Render immediately!
                        }
                    }

                    // 2. Timeout promise for syncUser
                    const syncPromise = syncUser(session.user.email, googleName);
                    // Use a shorter timeout logic for background if we have cache? 
                    // No, stick to safety.
                    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({ timeout: true }), 10000));

                    const result = await Promise.race([syncPromise, timeoutPromise]);

                    if (result.timeout) {
                        // If we have cache, we don't care as much about timeout, but we should verify eventually.
                        // However, if we have cache, we already set isLoading(false).
                        // So let's just log and return if we already rendered.
                        if (cachedRole) {
                            console.warn('Session sync timed out (background). Using cache.');
                            return;
                        }

                        console.error('Session sync timed out');
                        if (_event === 'SIGNED_IN') {
                            alert('ההתחברות לוקחת יותר מדי זמן. אנא נסה שנית או בדוק את החיבור לרשת.');
                        }
                        await supabase.auth.signOut();
                        // Loading will be cleared in finally
                        return;
                    }

                    const { role, name, isNew } = result;

                    // 3. Update Cache & State
                    localStorage.setItem(cacheKey, role);
                    if (name) localStorage.setItem(`${cacheKey}_name`, name);

                    if (mounted) {
                        setUser({
                            id: session.user.id,
                            name: name || googleName,
                            email: session.user.email,
                            avatar: session.user.user_metadata.avatar_url,
                            role: role
                        });
                        if (isNew) setIsCompletingProfile(true);
                    }
                } else {
                    setUser(null);
                }
            } catch (err) {
                console.error('Critical error during auth state sync:', err);
                // Force logout on critical error to reset state
                setUser(null);
                setSession(null);
            } finally {
                // Ensure loading is ALWAYS turned off
                if (mounted) {
                    setIsLoading(false);
                    clearTimeout(timeoutId); // CANCEL the global failsafe
                }
            }
        });

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, []);

    const loginWithGoogle = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error logging in:', error.message);
            alert('Error logging in with Google');
        }
    };

    const logoutHandler = async () => {
        // Immediately clear local state to give instant feedback
        setUser(null);
        setSession(null);

        // Clear caches
        localStorage.removeItem('cached_user_role');
        localStorage.removeItem('cached_user_name');

        try {
            const { error } = await supabase.auth.signOut();
            if (error) console.error('Error logging out:', error.message);
        } catch (err) {
            console.error('Unexpected error during logout:', err);
        }
    };

    // Manual login for dev/fallback (Name only) - Deprecated for test user function below
    const manualLogin = (name) => {
        setUser({ name, email: 'guest@example.com', role: 'user' });
    };

    const loginTestUser = async (role) => {
        console.log(`UserContext: Attempting test login for ${role}`);
        setIsLoading(true);
        let email = `niroz.test.${role}@gmail.com`;
        if (role === 'group_order') email = 'niroz.test.manager@gmail.com';

        const password = 'password123';

        // PRE-CACHE OPTIMIZATION
        // We know the roles for these specific emails, so we can pre-seed the cache
        // to avoid the DB round-trip on the next syncUser call.
        const cacheKey = `user_role_${email}`;
        localStorage.setItem(cacheKey, role);

        // Also pre-cache name
        let name = 'Test User';
        if (role === 'admin') name = 'Test Admin';
        if (role === 'group_order') name = 'Test Manager';
        localStorage.setItem(`${cacheKey}_name`, name);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('Test user login error:', error.message);
                alert(`Error logging in as test user: ${error.message}`);
                setIsLoading(false);
            }
            // Success updates are handled by onAuthStateChange
        } catch (err) {
            console.error('Unexpected error:', err);
            setIsLoading(false);
        }
    };

    const updateUser = async (updates) => {
        // Optimistic update
        setUser((prev) => ({ ...prev, ...updates }));

        if (updates.name && user?.email) {
            try {
                await supabase
                    .from('user_roles')
                    .update({ name: updates.name })
                    .eq('user_email', user.email);
            } catch (err) {
                console.error('Failed to update name in DB:', err);
            }
        }

        if (isCompletingProfile) {
            setIsCompletingProfile(false);
        }
    };

    if (isLoading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-text-main)',
                flexDirection: 'column'
            }}>
                <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
                <p style={{ marginTop: '20px' }}>טוען...</p>
            </div>
        );
    }

    return (
        <UserContext.Provider value={{
            user,
            session,
            loginWithGoogle,
            login: manualLogin, // Backward compatibility
            loginTestUser, // New test function
            updateUser,
            logout: logoutHandler,
            isLoading,
            isCompletingProfile // Expose this
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
export default UserContext;
