
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const client = createClient(supabaseUrl, supabaseKey);

const main = async () => {
  try {
    const schedules = await client.from('exam_schedules').select('*');
    if (schedules.error) {
      console.error('Error fetching exam_schedules:', schedules.error);
    } else if (schedules.data && schedules.data.length > 0) {
      console.log('Exam schedules data:', schedules.data);
    } else {
      console.log('No data found in exam_schedules table.');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
};

main();
