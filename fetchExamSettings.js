import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const client = createClient(supabaseUrl, supabaseKey);

const main = async () => {
  try {
    const settings = await client.from('exam_settings').select('*');
    if (settings.error) {
      console.error('Error fetching exam_settings:', settings.error);
    } else {
      console.log('Exam Settings Table:');
      console.table(settings.data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
};

main();
