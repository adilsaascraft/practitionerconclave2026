'use client'

import { useEffect, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import * as htmlToImage from 'html-to-image'
import Image from 'next/image'
import Link from 'next/link'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, CheckCircle2, Download } from 'lucide-react'
import { toast } from 'sonner'
import { useFormDraftStore } from '@/stores/useFormDraftStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { medicalCouncils } from '@/data/medicalCouncil'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { apiRequest } from '@/lib/apiRequest'
import { z } from 'zod'
import { EVEventRegistrationSchema } from '@/validations/registrationSchema'

type FormInput = z.input<typeof EVEventRegistrationSchema>
type FormOutput = z.output<typeof EVEventRegistrationSchema>

export default function EVreadyRegistrationPage() {
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [regNum, setRegNum] = useState<string | null>(null)
  const [showQr, setShowQr] = useState(false)
  const [agree, setAgree] = useState(false)
  const [termsError, setTermsError] = useState<string | null>(null)

  const DRAFT_KEY = 'ev-event-form'

  const webinarDraft = useFormDraftStore((state) => state.drafts[DRAFT_KEY])

  const setDraft = useFormDraftStore((state) => state.setDraft)
  const clearDraft = useFormDraftStore((state) => state.clearDraft)

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(EVEventRegistrationSchema),
    defaultValues: webinarDraft || {
      name: '',
      designation: '',
      institute: '',
      mobileNo: '',
      emailId: '',
      medicalCouncilNo: '',
      medicalCouncilState: '',
    },
  })

  const watchedValues = useWatch({ control })

  useEffect(() => {
    if (!success) {
      setDraft(DRAFT_KEY, watchedValues)
    }
  }, [watchedValues, success, setDraft])

  const handleNewRegistration = () => {
    reset({
      name: '',
      designation: '',
      institute: '',
      mobileNo: '',
      emailId: '',
      medicalCouncilNo: '',
      medicalCouncilState: '',
    })

    clearDraft(DRAFT_KEY)
    setAgree(false)
    setTermsError(null)
    setSuccess(false)
    setShowQr(false)
    setRegNum(null)
  }

  const onSubmit = async (data: FormOutput) => {
    if (!agree) {
      setTermsError('Please accept Terms & Conditions.')
      return
    }

    setTermsError(null)
    setSubmitting(true)

    try {
      const response = await apiRequest({
        endpoint: '/api/registers',
        method: 'POST',
        body: data,
      })

      if (!response?.data?.regNum) {
        throw new Error('Invalid response from server')
      }

      setRegNum(response.data.regNum)
      setSuccess(true)
      clearDraft(DRAFT_KEY)

      toast.success('Registration successful ⚡')

      setTimeout(() => {
        setShowQr(true)
      }, 1200)
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const downloadQrCard = async () => {
    const node = document.getElementById('evready-qr-card')

    if (!node) {
      toast.error('QR not ready yet')
      return
    }

    try {
      // Give QR time to render
      await new Promise((resolve) => setTimeout(resolve, 500))

      const rect = node.getBoundingClientRect()

      // Clone card
      const clone = node.cloneNode(true) as HTMLElement

      // Create isolated container
      const wrapper = document.createElement('div')

      Object.assign(wrapper.style, {
        position: 'fixed',
        left: '-100000px',
        top: '0',
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        margin: '0',
        padding: '0',
        background: '#ffffff',
        overflow: 'visible',
        transform: 'none',
      })

      Object.assign(clone.style, {
        position: 'relative',
        left: '0',
        top: '0',
        right: 'auto',
        bottom: 'auto',
        margin: '0',
        transform: 'none',
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        maxWidth: 'none',
        maxHeight: 'none',
      })

      wrapper.appendChild(clone)
      document.body.appendChild(wrapper)

      /*
       * IMPORTANT:
       * html-to-image does not reliably preserve the contents
       * of cloned <canvas> elements.
       *
       * Convert canvas QR codes into images.
       */
      const originalCanvases = node.querySelectorAll('canvas')
      const clonedCanvases = clone.querySelectorAll('canvas')

      originalCanvases.forEach((originalCanvas, index) => {
        const clonedCanvas = clonedCanvases[index]

        if (!clonedCanvas) return

        try {
          const img = document.createElement('img')

          img.src = originalCanvas.toDataURL('image/png')

          img.width = originalCanvas.width
          img.height = originalCanvas.height

          // Preserve the canvas's rendered size
          const canvasStyle = window.getComputedStyle(originalCanvas)

          img.style.width = canvasStyle.width
          img.style.height = canvasStyle.height
          img.style.display = canvasStyle.display
          img.style.objectFit = 'contain'

          clonedCanvas.parentNode?.replaceChild(img, clonedCanvas)
        } catch (err) {
          console.error('Could not convert QR canvas:', err)
        }
      })

      // Wait for converted QR images to load
      const images = Array.from(clone.querySelectorAll('img'))

      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve()

          return new Promise<void>((resolve) => {
            img.onload = () => resolve()
            img.onerror = () => resolve()
          })
        }),
      )

      // Allow browser to finish layout
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      )

      const blob = await htmlToImage.toBlob(clone, {
        backgroundColor: '#ffffff',
        pixelRatio: 3,
        cacheBust: true,
        width: rect.width,
        height: rect.height,

        style: {
          margin: '0',
          padding: '0',
          transform: 'none',
          position: 'relative',
          left: '0',
          top: '0',
        },
      })

      // Remove temporary DOM
      document.body.removeChild(wrapper)

      if (!blob) {
        throw new Error('PNG generation failed')
      }

      // Download
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `${regNum}-qr.png`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 1000)
    } catch (error) {
      console.error('QR download error:', error)
      toast.error('Download failed. Try again.')
    }
  }

  return (
    <div
      className="flex min-h-svh flex-col bg-gradient-to-br from-orange-200 via-orange-300 to-amber-200
"
    >
      {/* =========================================================
          BANNER
      ========================================================= */}
      <div className="relative w-full aspect-[19/4] overflow-hidden">
        <Image
          src="/banner.png"
          alt="Medivision"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* =========================================================
          MAIN CONTENT
      ========================================================= */}
      <main className="flex flex-1 items-center justify-center px-3 py-6 sm:px-5 sm:py-10">
        <Card className="w-full max-w-4xl border-white/30 bg-white/95 shadow-2xl backdrop-blur">
          <CardContent className="p-4 sm:p-6 md:p-8">
            {!success ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* =====================================================
                    HEADER
                ===================================================== */}
                <div className="border-b border-orange-200 pb-5 text-center">
                  <h1 className="text-xl font-bold text-orange-700 sm:text-2xl">
                    PRACTITIONER'S CONCLAVE 2026
                  </h1>

                  <p className="mt-1 text-xs text-gray-600 sm:text-sm">
                    By MediVision Eye Care Center
                  </p>

                  <p className="mt-3 text-sm font-bold uppercase tracking-wide text-orange-600">
                    Registration Form
                  </p>
                </div>

                {/* =====================================================
                    FORM
                    1 column mobile
                    2 columns tablet/laptop
                ===================================================== */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Name */}
                  <Field label="Full Name" error={errors.name?.message}>
                    <Controller
                      name="name"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="Enter your full name eg. Dr. Kumar Reddy"
                          className="border-orange-200 bg-white text-black placeholder:text-gray-400 focus-visible:ring-orange-500"
                        />
                      )}
                    />
                  </Field>

                  {/* Designation */}
                  <Field
                    label="Designation"
                    error={errors.designation?.message}
                  >
                    <Controller
                      name="designation"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="Enter your designation"
                          className="border-orange-200 bg-white text-black placeholder:text-gray-400 focus-visible:ring-orange-500"
                        />
                      )}
                    />
                  </Field>

                  {/* Institute */}
                  <Field label="Institute" error={errors.institute?.message}>
                    <Controller
                      name="institute"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="Enter institute name"
                          className="border-orange-200 bg-white text-black placeholder:text-gray-400 focus-visible:ring-orange-500"
                        />
                      )}
                    />
                  </Field>

                  {/* Mobile */}
                  <Field label="Mobile No." error={errors.mobileNo?.message}>
                    <Controller
                      name="mobileNo"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          placeholder="Enter 10 digit mobile number"
                          className="border-orange-200 bg-white text-black placeholder:text-gray-400 focus-visible:ring-orange-500"
                          onChange={(e) => {
                            field.onChange(e.target.value.replace(/\D/g, ''))
                          }}
                        />
                      )}
                    />
                  </Field>

                  {/* Email */}
                  <Field label="Email ID" error={errors.emailId?.message}>
                    <Controller
                      name="emailId"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="email"
                          placeholder="Enter your email ID"
                          className="border-orange-200 bg-white text-black placeholder:text-gray-400 focus-visible:ring-orange-500"
                          onChange={(e) => {
                            field.onChange(e.target.value.toLowerCase())
                          }}
                        />
                      )}
                    />
                  </Field>

                  {/* Medical Council No */}
                  <Field
                    label="Medical Council No."
                    error={errors.medicalCouncilNo?.message}
                  >
                    <Controller
                      name="medicalCouncilNo"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="Enter medical council number"
                          className="border-orange-200 bg-white text-black placeholder:text-gray-400 focus-visible:ring-orange-500"
                        />
                      )}
                    />
                  </Field>

                  {/* Medical Council State */}
                  <Field
                    label="Medical Council State"
                    error={errors.medicalCouncilState?.message}
                  >
                    <Controller
                      name="medicalCouncilState"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full border-orange-200 bg-white p-3 text-black focus:ring-orange-500">
                            <SelectValue placeholder="Select medical council state" />
                          </SelectTrigger>

                          <SelectContent>
                            {medicalCouncils.map((council) => (
                              <SelectItem
                                key={council.value}
                                value={council.value}
                              >
                                {council.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                </div>

                {/* =====================================================
                    TERMS
                ===================================================== */}
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={agree}
                      onCheckedChange={(value) => {
                        setAgree(!!value)

                        if (value) {
                          setTermsError(null)
                        }
                      }}
                      className="mt-0.5 border-orange-500 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                    />

                    <Label className="cursor-pointer text-sm leading-5 text-gray-700">
                      I agree to{' '}
                      <Link
                        href="/term-and-condition"
                        className="font-semibold text-orange-600 underline hover:text-orange-700"
                      >
                        Terms and Conditions
                      </Link>
                    </Label>
                  </div>

                  {termsError && (
                    <p className="mt-2 text-sm text-red-600">{termsError}</p>
                  )}
                </div>

                {/* =====================================================
                    REGISTER BUTTON
                ===================================================== */}
                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-11 w-full bg-orange-600 font-semibold text-white transition-colors hover:bg-orange-700"
                >
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}

                  {submitting ? 'Registering...' : 'Register Now'}
                </Button>
              </form>
            ) : (
              /* =======================================================
                 SUCCESS SCREEN
              ======================================================= */
              <div className="px-2 py-8 text-center sm:px-6 sm:py-10">
                <div className="flex justify-center">
                  <div className="rounded-full bg-orange-100 p-5">
                    <CheckCircle2 className="h-16 w-16 text-orange-600" />
                  </div>
                </div>

                <h2 className="mt-6 text-2xl font-bold text-orange-700">
                  Registration Successful 🎉
                </h2>

                <p className="mt-2 text-sm text-gray-600">
                  Your registration for{' '}
                  <span className="font-semibold text-gray-800">
                    PRACTITIONER'S CONCLAVE 2026
                  </span>{' '}
                  is confirmed.
                </p>

                {regNum && (
                  <div className="mt-4 inline-block rounded-full border border-orange-200 bg-orange-50 px-5 py-2 text-sm font-semibold text-orange-700">
                    Registration No: {regNum}
                  </div>
                )}

                {/* =====================================================
                    QR CARD
                ===================================================== */}
                {showQr && (
                  <div className="mt-8 space-y-5">
                    <div
                      id="evready-qr-card"
                      className="relative mx-auto w-[320px] max-w-full overflow-hidden rounded-2xl border bg-white shadow-xl"
                    >
                      {/* QR HEADER */}
                      <div className="bg-gradient-to-r from-orange-700 via-orange-600 to-amber-500 py-3 text-center text-white">
                        <p className="text-sm font-semibold">
                          PRACTITIONER'S CONCLAVE 2026
                        </p>

                        <p className="text-xs opacity-90">
                          By MediVision Eye Care Center
                        </p>
                      </div>

                      {/* QR BODY */}
                      <div className="relative flex flex-col items-center space-y-4 p-6">
                        {/* WATERMARK */}
                        <Image
                          src="/logo.png"
                          alt="logo"
                          width={120}
                          height={120}
                          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10"
                        />

                        {/* QR */}
                        <div className="relative z-10 mt-3 flex justify-center">
                          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <QRCodeCanvas value={regNum ?? ''} size={160} />
                          </div>
                        </div>

                        <p className="relative z-10 text-xs text-gray-500">
                          Scan at entry gate
                        </p>

                        <div className="w-full border-t border-dashed border-gray-300" />

                        <div className="text-xs text-gray-600">
                          Valid for entry • Do not share
                        </div>
                      </div>
                    </div>

                    {/* DOWNLOAD */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={downloadQrCard}
                        className="w-full border-orange-300 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download QR Code
                      </Button>
                    </div>
                  </div>
                )}

                {/* NEW REGISTRATION */}
                <div className="my-8 border-t border-gray-200" />

                <Button
                  type="button"
                  onClick={handleNewRegistration}
                  className="w-full bg-orange-600 font-semibold text-white hover:bg-orange-700"
                >
                  New Registration
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* =========================================================
          FOOTER
      ========================================================= */}
      <footer className="border-t border-white/20 bg-black/10 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center text-sm text-white">
          © {new Date().getFullYear()} All Rights Reserved. Powered by SaaScraft
          Studio (India) Pvt. Ltd.
        </div>
      </footer>
    </div>
  )
}

/* ===============================================================
   REUSABLE FIELD
================================================================ */

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="font-medium text-gray-800">
        {label} <span className="text-orange-600">*</span>
      </Label>

      {children}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
