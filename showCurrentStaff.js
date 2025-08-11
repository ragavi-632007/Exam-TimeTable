import 'dotenv/config';
import { authService } from './src/services/authService';

const main = async () => {
  try {
    const user = await authService.getCurrentUser();
    if (!user) {
      console.log('No staff user is currently logged in or found.');
    } else {
      console.log('Current Staff Details:');
      console.table(user);
    }
  } catch (err) {
    console.error('Error fetching current staff details:', err);
  }
};

main();
