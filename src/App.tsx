import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { Toaster } from 'react-hot-toast';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import type { User } from '@supabase/supabase-js';

function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <Toaster position="top-right" />
      {!user ? <Auth /> : <Dashboard user={user} />}
    </>
  );
}

export default App;