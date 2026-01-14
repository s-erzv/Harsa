"use client"
import { Moon, Sun } from "lucide-react"
import { useState, useEffect } from "react"

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const isDark = localStorage.getItem("theme") === "dark"
    setDarkMode(isDark)
    if (isDark) document.documentElement.classList.add("dark")
  }, [])

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
      setDarkMode(false)
    } else {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
      setDarkMode(true)
    }
  }

  return (
    <button 
      onClick={toggleTheme}
      className="p-2 rounded-xl bg-chalk dark:bg-stone/20 text-forest dark:text-clay transition-all hover:scale-105 active:scale-95"
    >
      {darkMode ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}