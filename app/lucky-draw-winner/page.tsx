'use client'
import Image from 'next/image'
import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import Papa from 'papaparse'
import confetti from 'canvas-confetti'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Loader2,
  Trophy,
  Users,
  Upload,
  Sparkles,
  Award,
  Zap,
  LogOut,
  Leaf,
  Battery,
  Wind,
  Flower2,
  Volume2,
  VolumeX,
} from 'lucide-react'

type Participant = {
  _id: string
  name: string
  email: string
  mobile: string
}

const TOTAL_DURATION = 60000 // 60 seconds
const COUNTDOWN_START = 50000 // Start countdown at 50 seconds elapsed (10 seconds left)
const SPIN_SPEED = 10 // Initial spin speed

export default function LuckyDraw() {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loadingLogin, setLoadingLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')

  // Main state
  const [participants, setParticipants] = useState<Participant[]>([])
  const [winner, setWinner] = useState<Participant | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [spinSpeed, setSpinSpeed] = useState(SPIN_SPEED)
  const [countdown, setCountdown] = useState<number>(60)
  const [stageDim, setStageDim] = useState(false)
  const [zoomWinner, setZoomWinner] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedWinner, setSelectedWinner] = useState<Participant | null>(null)
  const [showCountdown, setShowCountdown] = useState(false)
  const [glowIntensity, setGlowIntensity] = useState(1)
  const [showUploadScreen, setShowUploadScreen] = useState(true)
  const [isMuted, setIsMuted] = useState(false)

  // Refs
  const startTimeRef = useRef<number>(0)
  const animationFrameRef = useRef<number>(0)
  const spinIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const beepIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const audioRefs = useRef<{
    spin?: HTMLAudioElement
    win?: HTMLAudioElement
    tick?: HTMLAudioElement
  }>({})

  // Create beep sound using Web Audio API
  const createBeepSound = useCallback(
    (frequency: number, duration: number, volume: number) => {
      if (isMuted) return
      try {
        const audioContext = new (
          window.AudioContext || (window as any).webkitAudioContext
        )()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.value = frequency
        gainNode.gain.value = volume

        oscillator.start()
        oscillator.stop(audioContext.currentTime + duration)

        setTimeout(
          () => {
            audioContext.close()
          },
          duration * 1000 + 100,
        )
      } catch (error) {
        console.log('Beep error:', error)
      }
    },
    [isMuted],
  )

  // Play beep sound
  const playBeep = useCallback(
    (frequency: number = 600, duration: number = 0.1, volume: number = 0.4) => {
      createBeepSound(frequency, duration, volume)
    },
    [createBeepSound],
  )

  // Initialize audio
  useEffect(() => {
    // Create audio elements
    audioRefs.current = {
      spin: new Audio('/spin.mp3'),
      win: new Audio('/win.mp3'),
      tick: new Audio('/tick.mp3'),
    }

    // Configure audio settings
    Object.values(audioRefs.current).forEach((audio) => {
      if (audio) {
        audio.volume = 0.3
        audio.loop = true
        audio.load()
      }
    })

    return () => {
      // Cleanup audio
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) {
          audio.pause()
          audio.currentTime = 0
        }
      })
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current)
      }
      if (beepIntervalRef.current) {
        clearInterval(beepIntervalRef.current)
      }
    }
  }, [])

  // Play sound utility
  const playSound = useCallback(
    (sound: keyof typeof audioRefs.current, loop: boolean = false) => {
      if (isMuted) return
      const audio = audioRefs.current[sound]
      if (audio) {
        audio.loop = loop
        audio.currentTime = 0
        audio.play().catch(() => {})
      }
    },
    [isMuted],
  )

  // Stop sound
  const stopSound = useCallback((sound: keyof typeof audioRefs.current) => {
    const audio = audioRefs.current[sound]
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
  }, [])

  // Login handler
  const handleLogin = () => {
    setLoadingLogin(true)
    setTimeout(() => {
      if (
        email === process.env.NEXT_PUBLIC_ADMIN_EMAIL &&
        pin === process.env.NEXT_PUBLIC_ADMIN_PIN
      ) {
        setIsLoggedIn(true)
        setShowUploadScreen(true)
        toast.success('Welcome to ISOI 2026 Lucky Draw!', {
          icon: <Trophy className="w-4 h-4 text-green-400" />,
        })
      } else {
        toast.error('Invalid Credentials', {
          icon: '🔒',
        })
      }
      setLoadingLogin(false)
    }, 1000)
  }

  // Logout handler
  const handleLogout = () => {
    setIsLoggedIn(false)
    setParticipants([])
    setWinner(null)
    setSelectedWinner(null)
    setShowUploadScreen(true)
    setEmail('')
    setPin('')
    setIsRunning(false)
    setCurrentIndex(0)
    if (spinIntervalRef.current) {
      clearInterval(spinIntervalRef.current)
    }
    if (beepIntervalRef.current) {
      clearInterval(beepIntervalRef.current)
    }
    stopSound('spin')
    toast.success('Logged out successfully')
  }

  // CSV handler with validation
  const handleCSV = async (file: File) => {
    setIsUploading(true)
    try {
      const result = await new Promise<Papa.ParseResult<unknown>>(
        (resolve, reject) => {
          Papa.parse(file, {
            header: true,
            complete: resolve,
            error: reject,
          })
        },
      )

      if (!result.data || result.data.length === 0) {
        toast.error('CSV file is empty')
        return
      }

      // Validate and filter participants
      const validParticipants = (result.data as any[])
        .filter((p) => p.name && p.email && p.mobile)
        .map((p) => ({
          _id: p._id || crypto.randomUUID(),
          name: p.name,
          email: p.email,
          mobile: p.mobile,
        }))

      if (validParticipants.length === 0) {
        toast.error('No valid participants found in CSV')
        return
      }

      setParticipants(validParticipants)
      setShowUploadScreen(false)
      toast.success(
        `${validParticipants.length} Participants Loaded Successfully!`,
        {
          icon: <Users className="w-4 h-4 text-green-400" />,
        },
      )
    } catch (error) {
      toast.error('Failed to parse CSV file')
      console.error('CSV Parse Error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  // Secure winner selection
  const pickWinner = useCallback((): Participant => {
    const array = new Uint32Array(1)
    crypto.getRandomValues(array)
    const index = array[0] % participants.length
    return participants[index]
  }, [participants])

  // Spin function - updates current index rapidly
  const spin = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = prev + 1
      return next >= participants.length ? 0 : next
    })
  }, [participants.length])

  // Start draw
  const startDraw = () => {
    if (!participants.length) {
      toast.error('Please upload participants CSV first')
      setShowUploadScreen(true)
      return
    }

    // Pre-select winner
    const preSelectedWinner = pickWinner()
    setSelectedWinner(preSelectedWinner)
    setWinner(null)
    setIsRunning(true)
    setStageDim(false)
    setZoomWinner(false)
    setShowCountdown(false)
    setSpinSpeed(SPIN_SPEED)
    setCountdown(60)
    startTimeRef.current = Date.now()

    // Start spinning
    if (spinIntervalRef.current) {
      clearInterval(spinIntervalRef.current)
    }
    spinIntervalRef.current = setInterval(spin, 1000 / SPIN_SPEED) // SPIN_SPEED times per second

    // Start spin sound
    playSound('spin', true)

    // Clear any existing beep interval
    if (beepIntervalRef.current) {
      clearInterval(beepIntervalRef.current)
    }
  }

  // Reset to upload screen
  const resetToUpload = () => {
    setParticipants([])
    setWinner(null)
    setSelectedWinner(null)
    setIsRunning(false)
    setShowUploadScreen(true)
    setCurrentIndex(0)
    if (spinIntervalRef.current) {
      clearInterval(spinIntervalRef.current)
    }
    if (beepIntervalRef.current) {
      clearInterval(beepIntervalRef.current)
    }
    stopSound('spin')
  }

  // Celebration effect
  const celebrate = useCallback(() => {
    // Stop spin sound and play win sound
    stopSound('spin')
    if (!isMuted) {
      playSound('win', false)
    }

    // Celebration beeps
    const celebrationBeeps = [0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2]
    celebrationBeeps.forEach((delay, index) => {
      setTimeout(() => {
        playBeep(600 + index * 50, 0.15, 0.4)
      }, delay * 1000)
    })

    // Premium green-themed confetti effect
    const count = 300
    const defaults = {
      origin: { y: 0.6 },
      zIndex: 1000,
    }

    const greenColors = [
      '#00ff00',
      '#32cd32',
      '#98fb98',
      '#adff2f',
      '#7cfc00',
      '#00fa9a',
    ]

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
        colors: greenColors,
      })
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    })

    fire(0.2, {
      spread: 60,
    })

    fire(0.35, {
      spread: 100,
      decay: 0.91,
    })

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
    })

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    })

    // Second wave after 1 second
    setTimeout(() => {
      fire(0.25, {
        spread: 100,
        startVelocity: 35,
        origin: { y: 0.7 },
      })
    }, 1000)
  }, [playSound, playBeep, stopSound, isMuted])

  // Control spin speed and countdown based on elapsed time
  useEffect(() => {
    if (!isRunning || !selectedWinner || participants.length === 0) return

    const updateSpeedAndCountdown = () => {
      const elapsed = Date.now() - startTimeRef.current
      const remaining = Math.max(
        0,
        Math.ceil((TOTAL_DURATION - elapsed) / 1000),
      )

      setCountdown(remaining)

      // Start countdown at last 10 seconds
      if (elapsed >= COUNTDOWN_START && !showCountdown) {
        setShowCountdown(true)

        beepIntervalRef.current = setInterval(() => {
          playBeep(700, 0.1, 0.4)
          if (!isMuted && audioRefs.current.tick) {
            audioRefs.current.tick.currentTime = 0
            audioRefs.current.tick.play().catch(() => {})
          }
        }, 1000)
      }

      // Check if time is up
      if (elapsed >= TOTAL_DURATION) {
        setCurrentIndex(
          participants.findIndex((p) => p._id === selectedWinner._id),
        )

        setIsRunning(false)
        setStageDim(true)
        setZoomWinner(true)
        setWinner(selectedWinner)

        if (spinIntervalRef.current) {
          clearInterval(spinIntervalRef.current)
        }

        if (beepIntervalRef.current) {
          clearInterval(beepIntervalRef.current)
        }

        celebrate()
      }
    }

    const interval = setInterval(updateSpeedAndCountdown, 100)

    return () => {
      clearInterval(interval)
    }
  }, [
    isRunning,
    selectedWinner,
    participants,
    spin,
    showCountdown,
    playBeep,
    celebrate,
    isMuted,
  ])

  // Current participant being displayed
  const currentParticipant = participants[currentIndex]

  const Banner = () => (
    <div className="relative w-full overflow-hidden">
      <Image
        src="/banner.png"
        width={1600}
        height={776}
        priority
        sizes="100vw"
        className="w-full h-auto object-cover"
      />
    </div>
  )

  // Login screen - Green theme
  if (!isLoggedIn) {
    return (
      <>
        <Banner />
        <div className="bg-gradient-to-br from-green-950 via-emerald-900 to-green-950 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <Card className="bg-white/10 backdrop-blur-xl border-2 border-green-400/30 shadow-2xl shadow-green-500/20">
              <CardContent className="p-4 space-y-1">
                <div className="text-center">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    Lucky Draw Application
                  </h2>
                  <p className="text-green-300/60">Admin Portal</p>
                </div>

                <div className="space-y-4">
                  <Input
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/5 border-green-400/30 text-white placeholder:text-green-300/50 focus:border-green-400"
                  />
                  <Input
                    placeholder="PIN"
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="bg-white/5 border-green-400/30 text-white placeholder:text-green-300/50 focus:border-green-400"
                  />
                  <Button
                    onClick={handleLogin}
                    disabled={loadingLogin}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-6 text-lg shadow-lg shadow-green-500/30"
                  >
                    {loadingLogin ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      >
                        <Loader2 className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      'Enter the Lucky Draw System'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        {/* ---------------- FOOTER ---------------- */}
        <footer className="border-t bg-green-100 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-4 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} All Rights Reserved. Powered by
            SaaScraft Studio (India) Pvt. Ltd.
          </div>
        </footer>
      </>
    )
  }

  // Upload screen - Green theme
  if (showUploadScreen) {
    return (
      <>
        <Banner />
        <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-green-950 via-emerald-900 to-green-950 flex items-center justify-center p-4">
          {/* Logout button */}
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="absolute top-4 right-4 text-green-300 hover:text-green-400"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl"
          >
            <Card className="bg-white/10 backdrop-blur-xl border-2 border-green-400/30 shadow-2xl shadow-green-500/20">
              <CardContent className="p-12 space-y-8">
                <div className="text-center space-y-4">
                  <motion.div
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex justify-center"
                  >
                    <Upload className="w-20 h-20 text-green-400" />
                  </motion.div>
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    Ready for the Lucky Draw?
                  </h2>
                  <p className="text-green-300/60 text-lg">
                    Upload your participants list to begin
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="relative">
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleCSV(e.target.files[0])
                        }
                      }}
                      disabled={isUploading}
                      className="bg-white/5 border-green-400/30 text-white file:bg-green-500 file:text-white file:border-0 file:rounded-lg file:px-4 file:py-2 file:mr-4 hover:file:bg-green-600 cursor-pointer"
                    />
                    {isUploading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg"
                      >
                        <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
                      </motion.div>
                    )}
                  </div>

                  <div className="bg-green-400/10 border border-green-400/30 rounded-lg p-4">
                    <p className="text-sm text-green-300">
                      <span className="text-green-400 font-semibold">
                        CSV Format:
                      </span>{' '}
                      name, email, mobile
                    </p>
                    <p className="text-xs text-green-300/50 mt-2">
                      Example: Adil, adil@example.com, 1234567890
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        {/* ---------------- FOOTER ---------------- */}
        <footer className="border-t bg-green-100 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-4 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} All Rights Reserved. Powered by
            SaaScraft Studio (India) Pvt. Ltd.
          </div>
        </footer>
      </>
    )
  }

  // Ready to draw screen (after CSV upload) - Green theme
  if (!isRunning && !winner && participants.length > 0) {
    return (
      <>
        <Banner />
        <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-green-950 via-emerald-900 to-green-950 flex items-center justify-center p-4">
          {/* Logout button */}
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="absolute top-4 right-4 text-green-300 hover:text-green-400"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>

          {/* Back button */}
          <Button
            onClick={resetToUpload}
            variant="ghost"
            className="absolute top-4 left-4 text-green-300 hover:text-green-400"
          >
            ← Back
          </Button>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-4xl"
          >
            <Card className="bg-white/10 backdrop-blur-xl border-2 border-green-400/30 shadow-2xl shadow-green-500/20">
              <CardContent className="p-12 space-y-8">
                <div className="text-center space-y-4">
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className="flex justify-center"
                  >
                    <Users className="w-20 h-20 text-green-400" />
                  </motion.div>

                  <h2 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    {participants.length} Participants Ready
                  </h2>

                  <p className="text-green-300/60 text-lg">
                    Click below to start the lucky draw spin
                  </p>
                </div>

                {/* Preview first few participants */}
                <div className="bg-black/30 rounded-lg p-6 max-h-60 overflow-y-auto border border-green-400/20">
                  <h3 className="text-green-400 font-semibold mb-4">
                    Preview (First 5):
                  </h3>
                  <div className="space-y-2">
                    {participants.slice(0, 5).map((p, index) => (
                      <motion.div
                        key={p._id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center space-x-3 text-green-300"
                      >
                        <span className="text-green-400">{index + 1}.</span>
                        <span>{p.name}</span>
                        <span className="text-green-300/50 text-sm">
                          ({p.mobile})
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center gap-4 pt-4">
                  <Button
                    onClick={() => setIsMuted(!isMuted)}
                    variant="outline"
                    size="icon"
                    className="border-green-400/30 text-green-400 hover:bg-green-400/10"
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </Button>
                  <Button
                    onClick={startDraw}
                    size="lg"
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-12 py-6 text-xl shadow-lg shadow-green-500/30"
                  >
                    Start Lucky Draw Spin 🎲
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        {/* ---------------- FOOTER ---------------- */}
        <footer className="border-t bg-green-100 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-4 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} All Rights Reserved. Powered by
            SaaScraft Studio (India) Pvt. Ltd.
          </div>
        </footer>
      </>
    )
  }

  // Draw in progress - Spin Style
  if (isRunning) {
    return (
      <>
        <Banner />
        <div className="bg-gradient-to-br from-green-950 via-emerald-900 to-green-950 flex items-center justify-center p-4">
          {/* Logout button */}
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="absolute top-4 right-4 z-50 text-green-300 hover:text-green-400"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>

          {/* Mute button */}
          <Button
            onClick={() => setIsMuted(!isMuted)}
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 z-50 text-green-300 hover:text-green-400"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </Button>

          {/* Animated background effects - Green theme */}
          <motion.div
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,0,0.15),transparent_70%)]"
          />

          {/* Countdown Timer - Top Center with Green Theme */}
          <AnimatePresence>
            {showCountdown && (
              <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
              >
                <div className="relative">
                  {/* Glowing background - Green */}
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="absolute inset-0 bg-green-400 rounded-full blur-xl"
                  />

                  {/* Timer display */}
                  <div className="relative bg-black/50 backdrop-blur-xl border-4 border-green-400 rounded-full px-8 py-4">
                    <motion.span
                      animate={{
                        scale: [1, 1.1, 1],
                        color: ['#00ff00', '#adff2f', '#00ff00'],
                      }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent"
                    >
                      {countdown}s
                    </motion.span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Spin Display */}
          <div className="relative z-10 min-h-screen flex items-center justify-center">
            <div
              className="
  max-w-[380px]
  sm:max-w-[600px]
  md:max-w-[850px]
  lg:max-w-[1100px]
  xl:max-w-[1300px]
  mx-auto
  px-4
"
            >
              {/* Speed indicator */}
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-center mb-8"
              >
                <motion.div
                  className="h-1 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full mx-auto mt-2"
                  style={{ width: `${(spinSpeed / SPIN_SPEED) * 100}%` }}
                />
              </motion.div>

              {/* Main spin wheel/card */}
              <motion.div
                animate={{
                  scale: [1, 1.02, 1],
                  rotate: [0, 1, -1, 0],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className="relative"
              >
                {/* Glowing background */}
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-green-400 rounded-3xl blur-3xl"
                />

                {/* Main spin card */}
                <Card
                  className="
    w-[380px]
    sm:w-[600px]
    lg:w-[1000px]
    xl:w-[1200px]
    mx-auto
    relative
    bg-black/40
    backdrop-blur-2xl
    border border-green-400/40
    shadow-2xl shadow-green-500/30
    rounded-3xl
    overflow-hidden
  "
                >
                  <CardContent className="p-16">
                    {/* Decorative side icons */}
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 space-y-4">
                      {[Leaf, Zap, Flower2].map((Icon, i) => (
                        <motion.div
                          key={i}
                          animate={{
                            rotate: 360,
                            scale: [1, 1.2, 1],
                          }}
                          transition={{
                            duration: 3,
                            delay: i * 0.3,
                            repeat: Infinity,
                          }}
                        >
                          <Icon className="w-8 h-8 text-green-400/30" />
                        </motion.div>
                      ))}
                    </div>

                    <div className="absolute right-4 top-1/2 -translate-y-1/2 space-y-4">
                      {[Battery, Wind, Sparkles].map((Icon, i) => (
                        <motion.div
                          key={i}
                          animate={{
                            rotate: -360,
                            scale: [1, 1.2, 1],
                          }}
                          transition={{
                            duration: 3,
                            delay: i * 0.3,
                            repeat: Infinity,
                          }}
                        >
                          <Icon className="w-8 h-8 text-green-400/30" />
                        </motion.div>
                      ))}
                    </div>

                    {/* Current participant display */}
                    <div className="text-center space-y-6">
                      {/* Floating icons background */}
                      <div className="flex justify-center gap-4 mb-8">
                        {[Zap, Leaf, Sparkles].map((Icon, i) => (
                          <motion.div
                            key={i}
                            animate={{
                              y: [0, -10, 0],
                              rotate: [0, 10, -10, 0],
                            }}
                            transition={{
                              duration: 2,
                              delay: i * 0.2,
                              repeat: Infinity,
                            }}
                          >
                            <Icon className="w-12 h-12 text-green-400" />
                          </motion.div>
                        ))}
                      </div>

                      {/* Current spinning name */}
                      <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.1 }}
                      >
                        <h2
                          className="
    w-full
    break-words
    text-center
    text-3xl
    sm:text-5xl
    lg:text-7xl
    font-bold
    bg-gradient-to-r from-green-400 via-emerald-400 to-green-400
    bg-clip-text
    text-transparent
  "
                        >
                          {currentParticipant?.name}
                        </h2>
                      </motion.div>

                      {/* Spinning indicator */}
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                        className="flex justify-center gap-2 mt-8"
                      >
                        {[1, 2, 3].map((_, i) => (
                          <div
                            key={i}
                            className="w-3 h-3 rounded-full bg-green-400"
                            style={{
                              opacity: 0.3 + (spinSpeed / SPIN_SPEED) * 0.7,
                            }}
                          />
                        ))}
                      </motion.div>

                      {/* Info text */}
                      <p className="text-green-300/40 text-lg mt-8">
                        {participants.length} participants
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Bottom decorative icons */}
              <div className="flex justify-center gap-8 mt-12">
                {[Leaf, Battery, Wind, Flower2, Sparkles].map((Icon, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      y: [0, -5, 0],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 2,
                      delay: i * 0.1,
                      repeat: Infinity,
                    }}
                  >
                    <Icon className="w-6 h-6 text-green-400/40" />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* ---------------- FOOTER ---------------- */}
        <footer className="border-t bg-green-100 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-4 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} All Rights Reserved. Powered by
            SaaScraft Studio (India) Pvt. Ltd.
          </div>
        </footer>
      </>
    )
  }

  // Winner Reveal Screen - Premium Design with Green Theme
  if (winner) {
    return (
      <>
        <Banner />
        <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-green-950 via-emerald-900 to-green-950 flex items-center justify-center p-4">
          {/* Logout button */}
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="absolute top-4 right-4 z-50 text-green-300 hover:text-green-400"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>

          {/* Back button */}
          <Button
            onClick={resetToUpload}
            variant="ghost"
            className="absolute top-4 left-4 z-50 text-green-300 hover:text-green-400"
          >
            ← New Draw
          </Button>

          {/* Mute button */}
          <Button
            onClick={() => setIsMuted(!isMuted)}
            variant="ghost"
            size="icon"
            className="absolute top-4 left-24 z-50 text-green-300 hover:text-green-400"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </Button>

          {/* Premium background effects - Green */}
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,0,0.3),transparent_70%)]"
          />

          {/* Floating particles - Green icons */}
          {Array(40)
            .fill(0)
            .map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -300, 0],
                  x: [0, i % 2 === 0 ? 150 : -150, 0],
                  rotate: 360,
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 10 + i,
                  delay: i * 0.2,
                  repeat: Infinity,
                }}
                className="absolute"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
              >
                {i % 3 === 0 ? (
                  <Leaf className="w-8 h-8 text-green-400" />
                ) : i % 3 === 1 ? (
                  <Zap className="w-8 h-8 text-green-400" />
                ) : (
                  <Flower2 className="w-8 h-8 text-green-400" />
                )}
              </motion.div>
            ))}

          {/* Main winner content */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: zoomWinner ? 1.1 : 1, opacity: 1 }}
            transition={{ duration: 1, type: 'spring' }}
            className="relative z-10 min-h-screen flex items-center justify-center p-4"
          >
            <Card className="bg-white/10 backdrop-blur-2xl border-4 border-green-400/50 shadow-2xl shadow-green-500/30 max-w-3xl w-full">
              <CardContent className="p-12 space-y-8">
                {/* Trophy animation - Green */}
                <motion.div
                  animate={{
                    y: [0, -20, 0],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex justify-center"
                >
                  <div className="relative">
                    <Trophy className="w-32 h-32 text-green-400 filter drop-shadow-[0_0_30px_rgba(0,255,0,0.7)]" />
                    <motion.div
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-green-400 rounded-full filter blur-xl"
                    />
                  </div>
                </motion.div>

                {/* Winner text */}
                <div className="text-center space-y-4">
                  <motion.h2
                    animate={{
                      textShadow: [
                        '0 0 10px rgba(0,255,0,0.5)',
                        '0 0 20px rgba(0,255,0,0.8)',
                        '0 0 10px rgba(0,255,0,0.5)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-xl md:text-2xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 bg-clip-text text-transparent"
                  >
                    Lucky Draw EV 2 Wheeler Winner
                  </motion.h2>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                    className="space-y-4"
                  >
                    <p className="text-4xl md:text-6xl font-bold text-white">
                      {winner.name}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="bg-white/5 backdrop-blur rounded-lg p-4 border border-green-400/30"
                      >
                        <p className="text-sm text-green-300/60">Contact</p>
                        <p className="text-xl text-green-400">
                          {winner.mobile}
                        </p>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="bg-white/5 backdrop-blur rounded-lg p-4 border border-emerald-400/30"
                      >
                        <p className="text-sm text-green-300/60">Email</p>
                        <p className="text-xl text-emerald-400">
                          {winner.email}
                        </p>
                      </motion.div>
                    </div>

                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      className="mt-8"
                    >
                      <Award className="w-16 h-16 mx-auto text-green-400" />
                    </motion.div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        {/* ---------------- FOOTER ---------------- */}
        <footer className="border-t bg-green-100 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-4 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} All Rights Reserved. Powered by
            SaaScraft Studio (India) Pvt. Ltd.
          </div>
        </footer>
      </>
    )
  }

  // Fallback (should never reach here)
  return null
}
