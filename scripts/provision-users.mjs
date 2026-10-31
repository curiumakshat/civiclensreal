import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const required = ['SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'USER_EMAIL', 'USER_PASSWORD'];
for (const key of required) if (!process.env[key]) throw new Error(`Missing ${key} in .env`);

const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const create = async (email, password, role) => {
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: email.split('@')[0] } });
  if (error && !error.message.toLowerCase().includes('already')) throw error;
  const id = data?.user?.id;
  if (id) {
    const { error: profileError } = await admin.from('profiles').upsert({ id, display_name: email.split('@')[0], role });
    if (profileError) throw profileError;
  }
  console.log(`${role} account ready: ${email}`);
};
await create(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD, 'admin');
await create(process.env.USER_EMAIL, process.env.USER_PASSWORD, 'user');
