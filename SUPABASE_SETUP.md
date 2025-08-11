# Supabase Setup Guide

This guide will help you set up Supabase for the Examination Management System.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. Node.js and npm installed
3. The project dependencies installed (`npm install`)

## Step 1: Create a Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `examination-management-system`
   - Database Password: Choose a strong password
   - Region: Choose the closest region to your users
5. Click "Create new project"

## Step 2: Get Your Supabase Credentials

1. In your Supabase dashboard, go to Settings > API
2. Copy the following values:
   - Project URL
   - Anon (public) key

## Step 3: Set Up Environment Variables

1. Create a `.env` file in the project root:
```bash
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

2. Replace the placeholder values with your actual Supabase credentials

## Step 4: Set Up the Database Schema

1. In your Supabase dashboard, go to SQL Editor
2. Copy the contents of `supabase-schema.sql`
3. Paste it into the SQL Editor and click "Run"

This will create:
- Users table with authentication
- Exams table for exam management
- Exam alerts table for notifications
- Departments table
- Sample data
- Row Level Security (RLS) policies

## Step 5: Create Users in Supabase Auth

You need to create the users in Supabase Auth before they can log in:

1. Go to Authentication > Users in your Supabase dashboard
2. Click "Add user" for each user:

### Admin User
- Email: `admin@cit.edu.in`
- Password: `admin123`
- User ID: `00000000-0000-0000-0000-000000000001`

### Teacher Users
- Email: `priya.sharma@cit.edu.in`
- Password: `teacher123`
- User ID: `00000000-0000-0000-0000-000000000002`

- Email: `rajesh.kumar@cit.edu.in`
- Password: `teacher123`
- User ID: `00000000-0000-0000-0000-000000000003`

- Email: `anjali.menon@cit.edu.in`
- Password: `teacher123`
- User ID: `00000000-0000-0000-0000-000000000004`

- Email: `aptitude.test@cit.edu.in`
- Password: `teacher123`
- User ID: `00000000-0000-0000-0000-000000000005`

## Step 6: Configure Authentication Settings

1. Go to Authentication > Settings in your Supabase dashboard
2. Under "Site URL", add your development URL (e.g., `http://localhost:5173`)
3. Under "Redirect URLs", add your development URL

## Step 7: Test the Connection

1. Start the development server:
```bash
npm run dev
```

2. Try logging in with the credentials:
   - Admin: `admin@cit.edu.in` / `admin123`
   - Teacher: `priya.sharma@cit.edu.in` / `teacher123`

## Features Now Available

With Supabase integration, the application now supports:

### Authentication
- Secure user authentication with Supabase Auth
- Role-based access control (admin/teacher)
- Session management

### Real-time Data
- All exam data is stored in Supabase
- Real-time updates across all users
- Secure data access with Row Level Security

### Database Features
- Automatic backups
- Real-time subscriptions (can be added later)
- Built-in security with RLS policies

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Make sure your `.env` file exists and has the correct values
   - Restart the development server after creating the `.env` file

2. **"Invalid credentials"**
   - Ensure users are created in Supabase Auth
   - Check that the user IDs match between Auth and the users table

3. **"Permission denied"**
   - Check that RLS policies are properly set up
   - Verify user roles in the database

4. **"Network error"**
   - Check your internet connection
   - Verify the Supabase URL is correct
   - Ensure your IP is not blocked by Supabase

### Debugging

1. Check the browser console for error messages
2. Check the Supabase dashboard logs
3. Verify environment variables are loaded correctly

## Security Features

The application includes several security features:

- **Row Level Security (RLS)**: Users can only access data they're authorized to see
- **Role-based access**: Admins can see all data, teachers only see their assigned exams
- **Secure authentication**: Uses Supabase Auth with JWT tokens
- **Input validation**: All user inputs are validated
- **SQL injection protection**: Uses parameterized queries

## Next Steps

After setting up Supabase, you can:

1. Add real-time subscriptions for live updates
2. Implement file uploads for exam materials
3. Add email notifications
4. Set up automated backups
5. Add more advanced analytics

## Support

If you encounter issues:

1. Check the Supabase documentation: https://supabase.com/docs
2. Review the error messages in the browser console
3. Check the Supabase dashboard logs
4. Ensure all environment variables are set correctly 