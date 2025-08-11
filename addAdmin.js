import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const client = createClient(supabaseUrl, supabaseKey);

const adminEmail = 'admin@cit.com';
const adminPassword = 'admin123';
const adminName = 'Admin User';
const adminDepartment = 'ADMIN';

const main = async () => {
  // 1. Create Supabase Auth user
  const { data: authData, error: authError } = await client.auth.signUp({
    email: adminEmail,
    password: adminPassword
  });

  if (authError) {
    console.error('Error creating Supabase Auth user:', authError);
    return;
  }

  const userId = authData.user?.id;
  if (!userId) {
    console.error('No user ID returned from Supabase Auth.');
    return;
  }

  // 2. Insert into staff_details
  const { data: staffData, error: staffError } = await client.from('staff_details').insert([
    {
      name: adminName,
      email: adminEmail,
      department: adminDepartment,
      role: 'admin',
      user_id: userId
    }
  ]).select('*');

  if (staffError) {
    console.error('Error inserting into staff_details:', staffError);
    return;
  }

  console.log('Admin user created successfully!');
  console.log('Inserted row:', staffData);
  console.log('Email:', adminEmail);
  console.log('Password:', adminPassword);

  // 3. Verify admin exists
  const { data: admins, error: adminError } = await client.from('staff_details').select('*').eq('role', 'admin');
  if (adminError) {
    console.error('Error verifying admin:', adminError);
  } else {
    console.log('Current admin users:');
    console.table(admins);
  }
};

main();
