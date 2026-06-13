'use client';

import { loginOrSignup } from '@/actions/auth';
import Link from 'next/link';
import { useState } from 'react';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState('');

  async function handleSubmit(formData: FormData) {
    setError('');
    formData.append('mode', mode);
    const result = await loginOrSignup(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left Side - Visual */}
      <div style={{ 
        flex: 1, 
        background: 'var(--black-soft)', 
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '3rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle decorative element */}
        <div style={{ 
          position: 'absolute', 
          top: '-10%', 
          left: '-10%', 
          width: '50vw', 
          height: '50vw', 
          background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <Link href="/" className="nav-brand" style={{ position: 'relative', zIndex: 1 }}>Premium Split</Link>
        
        <div className="fade-in" style={{ position: 'relative', zIndex: 1, animationDelay: '0.2s' }}>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', marginBottom: '1.5rem', maxWidth: '600px' }}>
            Manage your shared expenses with elegance.
          </h1>
          <p style={{ color: 'var(--grey-light)', maxWidth: '400px', fontSize: '1.1rem' }}>
            A sophisticated approach to splitting bills, handling multi-currency, and keeping track of group finances.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1, fontSize: '0.75rem', color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Spreetail Assignment
        </div>
      </div>

      {/* Right Side - Form */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '2rem',
        background: 'var(--black)'
      }}>
        <div className="slide-up" style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '2.5rem' }}>
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p style={{ color: 'var(--grey-light)' }}>
              {mode === 'login' ? 'Sign in to your account to continue' : 'Fill in your details to get started'}
            </p>
          </div>

          {/* Mode Toggle */}
          <div style={{ 
            display: 'flex', 
            marginBottom: '2.5rem', 
            border: '1px solid var(--border)', 
            overflow: 'hidden' 
          }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: mode === 'login' ? 'var(--cream)' : 'transparent',
                color: mode === 'login' ? 'var(--black)' : 'var(--grey)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                transition: 'all 0.3s ease',
              }}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); }}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: mode === 'signup' ? 'var(--cream)' : 'transparent',
                color: mode === 'signup' ? 'var(--black)' : 'var(--grey)',
                border: 'none',
                borderLeft: '1px solid var(--border)',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                transition: 'all 0.3s ease',
              }}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div style={{ 
              padding: '1rem', 
              marginBottom: '2rem', 
              border: '1px solid rgba(204, 68, 68, 0.3)', 
              color: 'var(--red-soft)', 
              fontSize: '0.85rem',
              lineHeight: '1.5'
            }}>
              {error}
            </div>
          )}
          
          <form action={handleSubmit}>
            {mode === 'signup' && (
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label htmlFor="name" className="form-label">Full Name</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  className="form-input" 
                  placeholder="e.g. Rohan" 
                  required={mode === 'signup'}
                  style={{ fontSize: '1.1rem', padding: '1rem 0' }}
                />
              </div>
            )}
            
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label htmlFor="email" className="form-label">Email Address</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                className="form-input" 
                placeholder="rohan@flat4b.com" 
                required 
                style={{ fontSize: '1.1rem', padding: '1rem 0' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '3rem' }}>
              <label htmlFor="password" className="form-label">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                className="form-input" 
                placeholder="••••••••" 
                required 
                minLength={6}
                style={{ fontSize: '1.1rem', padding: '1rem 0' }}
              />
            </div>
            
            <button type="submit" className="btn btn-filled" style={{ width: '100%', padding: '1.25rem', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.9rem', letterSpacing: '0.15em' }}>
                {mode === 'login' ? 'Sign In →' : 'Create Account →'}
              </span>
            </button>
          </form>

          <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {mode === 'login' 
                ? 'Don\'t have an account? Switch to Sign Up above' 
                : 'Already registered? Switch to Login above'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
