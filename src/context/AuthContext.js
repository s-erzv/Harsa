"use client"
import { createClient } from '@supabase/supabase-js'
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
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

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) setProfile(data)
  }, [])

  useEffect(() => { 
    const getInitialAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id)
      }
      setIsInitialLoad(false) 
    }
 
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        fetchProfile(currentUser.id)
      } else {
        setProfile(null)
      }
    })

    getInitialAuth()
    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const register = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    if (error) throw error
    return data
  }

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    router.push('/dashboard')
    return data
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    router.push('/login')
  }

  const updateWalletAddress = async (address) => {
    if (!user) return
    const { error } = await supabase.from('profiles').update({ wallet_address: address }).eq('id', user.id)
    if (error) throw error
    fetchProfile(user.id)
  }

  return (
    <SupabaseContext.Provider value={{ 
      user, 
      profile, 
      login, 
      logout, 
      register, 
      supabase, 
      isInitialLoad, 
      updateWalletAddress 
    }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export const useAuth = () => useContext(SupabaseContext)