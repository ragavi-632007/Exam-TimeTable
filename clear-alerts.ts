/**
 * Clear All Alerts Utility Script
 * 
 * Usage: Run this in your browser console after logging into the application
 * 
 * Steps:
 * 1. Navigate to the app and log in
 * 2. Open browser console (F12)
 * 3. Copy and paste the clearAllAlerts() function below
 * 4. Run it with: clearAllAlerts()
 * 
 * Or directly clear via Supabase SQL:
 * DELETE FROM exam_settings;
 */

// Direct Supabase deletion via SQL
// Open Supabase SQL editor and run:
/*
DELETE FROM exam_settings WHERE true;
*/

// Browser console method (copy and run this in your app's console):
/*
(async () => {
  // Get the supabase client from the window object or context
  const { supabase } = await import('./src/lib/supabase.ts');
  
  try {
    console.log('🗑️ Clearing all alerts...');
    
    // Delete all records from exam_settings
    const { error } = await supabase
      .from('exam_settings')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000');
    
    if (error) {
      console.error('❌ Error deleting alerts:', error);
    } else {
      console.log('✅ All alerts cleared successfully!');
      console.log('Refreshing page...');
      window.location.reload();
    }
  } catch (err) {
    console.error('Error:', err);
  }
})();
*/

// Recommended: Use the Supabase Dashboard
/*
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run this query:
   DELETE FROM exam_settings;
4. Click "Run" button
5. Confirm deletion
*/

