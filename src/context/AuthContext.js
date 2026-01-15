"use client"
import { createClient } from '@supabase/supabase-js'
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const SupabaseContext = createContext()

export const AuthProvider = ({ children }) => {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const authInitialized = useRef(false) // Lock buat inisialisasi

  // Fetch profile dengan error handling yang lebih silent (puitis)
  const fetchProfile = useCallback(async (userId) => {
    if (!userId) return null
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    
    if (data) {
      setProfile(data)
      return data
    }
    return null
  }, [])

  useEffect(() => {
    if (authInitialized.current) return
    authInitialized.current = true

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        }
      } finally {
        setIsInitialLoad(false)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null
      
      // Cek kalau bener-bener ada perubahan user biar gak re-fetch terus pas pindah tab
      if (currentUser?.id !== user?.id) {
        setUser(currentUser)
        if (currentUser) {
          await fetchProfile(currentUser.id)
        } else {
          setProfile(null)
        }
      }
      
      // Set loading false kalau ini trigger pertama
      setIsInitialLoad(false)
    })

    initializeAuth()
    return () => subscription.unsubscribe()
  }, [fetchProfile, user?.id])

  const authWithWallet = async (address) => {
    const cleanAddress = address.toLowerCase()
    const dummyEmail = `${cleanAddress}@harsa.network`
    const walletPassword = `${cleanAddress}_harsa_secure`

    // Coba login dulu
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: dummyEmail,
      password: walletPassword,
    })

    if (!signInError) {
      const p = await fetchProfile(signInData.user.id)
      return { success: true, user: signInData.user, profile: p }
    }

    // Kalau gagal (user baru), langsung daftar
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: dummyEmail,
      password: walletPassword,
      options: { data: { full_name: `Node ${cleanAddress.slice(2, 8).toUpperCase()}` } }
    })

    if (signUpError) throw signUpError

    if (signUpData.user) {
      // Tunggu profile dibuat via trigger (jika ada) atau paksa update
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .update({ 
          wallet_address: cleanAddress,
          full_name: `Node ${cleanAddress.slice(2, 8).toUpperCase()}`
        })
        .eq('id', signUpData.user.id)
        .select()
        .single()
      
      setProfile(updatedProfile)
    }

    return { success: true, user: signUpData.user }
  }

  const register = async (email, password, fullName, walletAddress = '') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    })
    if (error) throw error
    if (data.user && walletAddress) {
      await supabase.from('profiles').update({ 
        wallet_address: walletAddress.toLowerCase(),
        full_name: fullName 
      }).eq('id', data.user.id)
    }
    return data
  }

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    router.push('/login')
  }

  return (
    <SupabaseContext.Provider value={{ 
      user, profile, login, logout, register, authWithWallet, 
      supabase, isInitialLoad, 
      refreshProfile: () => user && fetchProfile(user.id) 
    }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export const useAuth = () => useContext(SupabaseContext)