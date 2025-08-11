import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const client = createClient(supabaseUrl, supabaseKey);

const main = async () => {
  try {
    const subjects = await client.from('subject_detail').select('*');
    if (subjects.error) {
      console.error('Error fetching subject_detail:', subjects.error);
    } else {
      console.log('Subject Detail Table:');
      console.table(subjects.data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
};

main();
