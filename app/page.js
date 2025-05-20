'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSpotifyClient } from '@/hooks/useSpotifyClient';
import './globals.css';

export default function Home() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const { login, user } = useSpotifyClient();

  // Animation effect for sections
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Handle Get Started button click
  const handleGetStarted = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      login();
    }
  };

  // Features section data
  const features = [
    {
      title: 'Collaborative Listening',
      description: 'Create music sessions and listen together with friends in real-time.',
      icon: '🎧'
    },
    {
      title: 'Spotify Integration',
      description: 'Connect with your Spotify account and access your playlists and favorite tracks.',
      icon: '🎵'
    },
    {
      title: 'Session Sharing',
      description: 'Share your music sessions with a simple code for others to join instantly.',
      icon: '🔗'
    },
    {
      title: 'Real-time Controls',
      description: 'Play, pause, skip, and control the music experience together.',
      icon: '⏯️'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Navigation */}
      <nav className="px-6 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
            AudiOrbit
          </h1>
        </div>
        <div>
          <button
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-500 text-white font-medium py-2 px-4 rounded-full transition duration-300"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20 md:py-32 flex flex-col items-center text-center">
        <div className={`transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 mb-6">
            Listen Together,<br />Experience Together
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-10">
            AudiOrbit brings people together through the power of shared music experiences.
            Create sessions, invite friends, and enjoy synchronized listening in perfect harmony.
          </p>
          <button
            onClick={handleGetStarted}
            className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-500 text-white text-lg font-bold py-4 px-10 rounded-full transition duration-300 shadow-lg hover:shadow-xl"
          >
            {user ? 'Go to Dashboard' : 'Get Started'}
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-black bg-opacity-40">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
            Experience the Future of Social Listening
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`bg-gray-800 bg-opacity-50 backdrop-blur-lg p-6 rounded-xl border border-gray-700 transform transition-all duration-500 hover:scale-105 hover:shadow-xl ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
            How AudiOrbit Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-xl font-bold mb-2">Sign In with Spotify</h3>
              <p className="text-gray-300">Connect your Spotify account to access your music library and playlists.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-xl font-bold mb-2">Create or Join a Session</h3>
              <p className="text-gray-300">Start a new listening session or join an existing one with a session code.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-xl font-bold mb-2">Listen Together</h3>
              <p className="text-gray-300">Enjoy synchronized music with friends, no matter where they are.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-orange-900/20 to-orange-600/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Start Your Music Journey?</h2>
          <p className="text-xl text-gray-300 mb-10">Join AudiOrbit today and experience music in a whole new way.</p>
          <a
            href="/api/auth/login"
            className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-500 text-white text-lg font-bold py-4 px-10 rounded-full transition duration-300 shadow-lg hover:shadow-xl"
          >
            Get Started Now
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 bg-black bg-opacity-60">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 mb-4">
            AudiOrbit
          </h3>
          <p className="text-gray-400 mb-6">© {new Date().getFullYear()} AudiOrbit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
