"use client"
import { createClient } from '@supabase/supabase-js'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const SupabaseContext = createContext()

export const AuthProvider = ({ children }) => {
  const router = useRouter()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const setData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    setData()
    return () => listener.subscription.unsubscribe()
  }, [supabase.auth])

  const register = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
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
    router.push('/login')
  }

  return (
    <SupabaseContext.Provider value={{ user, login, register, logout, supabase, loading }}>
      {!loading && children}
    </SupabaseContext.Provider>
  )
}

export const useAuth = () => useContext(SupabaseContext)