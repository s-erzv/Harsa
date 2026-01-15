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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null
      
      setUser(currentUser)

      if (currentUser) {
        fetchProfile(currentUser.id).finally(() => {
          setIsInitialLoad(false)
        })
      } else {
        setProfile(null)
        setIsInitialLoad(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const authWithWallet = async (address) => {
    const cleanAddress = address.toLowerCase()
    const dummyEmail = `${cleanAddress}@harsa.network`
    const walletPassword = `${cleanAddress}_harsa_secure`

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: dummyEmail,
      password: walletPassword,
    })

    if (!signInError) {
      const p = await fetchProfile(signInData.user.id)
      return { success: true, user: signInData.user, profile: p }
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: dummyEmail,
      password: walletPassword,
      options: { data: { full_name: `Node ${cleanAddress.slice(2, 8).toUpperCase()}` } }
    })

    if (signUpError) throw signUpError

    if (signUpData.user) {
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