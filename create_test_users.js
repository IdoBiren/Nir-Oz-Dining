
import { createClient } from '@supabase/supabase-js';

// Configuration - using the hardcoded values verified earlier
const supabaseUrl = 'https://qylehpuzpcftfzslktrz.supabase.co';
const supabaseKey = 'sb_publishable_pwBVXgI4YMCsmbpvOmIlOw_tpPtoCmD';

const supabase = createClient(supabaseUrl, supabaseKey);

const testUsers = [
    { email: 'niroz.test.user@gmail.com', password: 'password123', role: 'user', name: 'Test User' },
    { email: 'niroz.test.manager@gmail.com', password: 'password123', role: 'group_order', name: 'Test Manager' },
    { email: 'niroz.test.admin@gmail.com', password: 'password123', role: 'admin', name: 'Test Admin' }
];

async function createUsers() {
    console.log('Creating test users...');

    for (const u of testUsers) {
        // 1. Sign Up (Creates auth user)
        const { data, error } = await supabase.auth.signUp({
            email: u.email,
            password: u.password,
            options: {
                data: { full_name: u.name }
            }
        });

        if (error) {
            console.log(`Note for ${u.email}: ${error.message}`);
            // If already registered, we just proceed to update role
        } else {
            console.log(`Created Auth User: ${u.email}`);
        }

        // 2. We can't insert into user_roles directly from client usually due to RLS,
        // UNLESS we are Anon and the policy allows it on creation.
        // But our app logic does it on login ("syncUser").
        // So we will rely on the App's "syncUser" logic to create the role entry 
        // when we first log in.
    }

    console.log('\nDone! Users created/verified.');
    console.log('Now updating UserContext to use real logins...');
}

createUsers();
