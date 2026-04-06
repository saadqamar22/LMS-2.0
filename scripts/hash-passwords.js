/**
 * Script to hash existing plain text passwords in the database
 * Run this with: node scripts/hash-passwords.js
 */

require('dotenv').config({ path: '.env.local' });
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function hashPasswords() {
  try {
    console.log('Fetching users with plain text passwords...');
    
    // Fetch all users
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, email, password');

    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('No users found.');
      return;
    }

    console.log(`Found ${users.length} users. Hashing passwords...`);

    // Hash each password and update
    for (const user of users) {
      // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      if (user.password && user.password.startsWith('$2')) {
        console.log(`Password for ${user.email} is already hashed, skipping...`);
        continue;
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      // Update the user
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: hashedPassword })
        .eq('id', user.id);

      if (updateError) {
        console.error(`Error updating password for ${user.email}:`, updateError);
      } else {
        console.log(`✓ Hashed and updated password for ${user.email}`);
      }
    }

    console.log('\nDone! All passwords have been hashed.');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

hashPasswords();

