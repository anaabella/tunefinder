'use client';

import React, { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from 'react';

interface AudioContextType {
  playPreview: (songId: string, url: string) => void;
  stopPreview: () => void;
  currentPreview: { songId: string; state: 'playing' | 'paused' | 'loading' } | null;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function useAudioPreview() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudioPreview must be used within an AudioPreviewController');
  }
  return context;
}

export function AudioPreviewController({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentPreview, setCurrentPreview] = useState<AudioContextType['currentPreview']>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const stopPreview = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setCurrentPreview(null);
  }, []);

  const playPreview = useCallback((songId: string, url: string) => {
    // If clicking the same song that's already playing, pause it.
    if (currentPreview?.songId === songId && currentPreview.state === 'playing') {
      stopPreview();
      return;
    }

    // Stop any currently playing preview
    stopPreview();

    // Start loading the new one
    setCurrentPreview({ songId, state: 'loading' });
    
    if (!audioRef.current) {
        audioRef.current = new Audio();
    }

    audioRef.current.src = url;
    audioRef.current.load();
    
    const onCanPlay = () => {
        audioRef.current?.play();
    };

    const onPlay = () => {
        setCurrentPreview({ songId, state: 'playing' });
        // Set a timeout to stop playback after 30 seconds
        timeoutRef.current = setTimeout(() => {
            stopPreview();
        }, 30000); 
    };

    const onEnded = () => {
        stopPreview();
    };

    const onError = () => {
        // Handle errors, maybe show a toast
        console.error("Error playing audio preview");
        stopPreview();
    };

    audioRef.current.addEventListener('canplay', onCanPlay);
    audioRef.current.addEventListener('play', onPlay);
    audioRef.current.addEventListener('ended', onEnded);
    audioRef.current.addEventListener('error', onError);

    // Cleanup function
    const cleanup = () => {
        if (audioRef.current) {
            audioRef.current.removeEventListener('canplay', onCanPlay);
            audioRef.current.removeEventListener('play', onPlay);
            audio_ref.current.removeEventListener('ended', onEnded);
            audio_ref.current.removeEventListener('error', onError);
        }
    }
    
    // Store cleanup function in ref to call it before re-assigning listeners
    if (audioRef.current.cleanup) {
        audioRef.current.cleanup();
    }
    audioRef.current.cleanup = cleanup;


  }, [currentPreview, stopPreview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, [stopPreview]);


  const value = {
    playPreview,
    stopPreview,
    currentPreview,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}
