'use client'
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@nextui-org/button";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error.message);
      } else {
        setUser(data.session?.user ?? null);

        // Kullanıcı oturum açmamışsa otomatik olarak Apple ile oturum açma sürecini başlat
        if (!data.session?.user) {
          signInWithApple();
        }
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (_event === 'SIGNED_OUT') {
        setErrorMessage('İptal edildi');
      }
    });

    return () => {
      authListener.subscription?.unsubscribe();
    };
  }, []);

  const signInWithApple = async () => {
    setErrorMessage(null); // Önceki hata mesajını temizleyin
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
      });
      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Hata: ', error.message);
      setErrorMessage('Bir hata oluştu, lütfen tekrar deneyin.');
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Hata: ', error.message);
  };

  return (
    <div>
      {user ? (
        <div>
          <p>Welcome, {user.user_metadata?.full_name || user.email}</p>
          <Button onClick={signOut}>Logout</Button>
        </div>
      ) : (
        <div>
          <Button onClick={signInWithApple}>Sign in with Apple</Button>
          {errorMessage && <p>{errorMessage}</p>} {/* Hata mesajını göster */}
        </div>
      )}
    </div>
  );
}