import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const client = createClient(supabaseUrl, supabaseKey);

const main = async () => {
  try {
    // Replace this value with the actual id you want to check
    const idToCheck = 'cdf14a0f-80b9-40c0-84f3-5eff78bd613b';
    const staff = await client.from('staff_details').select('*').eq('id', idToCheck);
    if (staff.error) {
      console.error('Error fetching staff_details:', staff.error);
    } else {
      console.log(`Staff record for id = ${idToCheck}:`);
      console.table(staff.data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
};

main();
