'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function TermsAndConditionsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 700)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-orange-50 to-amber-100 px-3 py-6 sm:px-4 sm:py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* =========================================================
            HEADER
        ========================================================= */}
        <div className="border-b border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 px-5 py-5 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Back */}
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center text-sm font-medium text-gray-600 transition-colors hover:text-orange-600"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Registration
            </button>

            {/* Logo */}
            <Image
              src="/logo.png"
              alt="MediVision Eye Care Center"
              width={100}
              height={50}
              className="h-auto max-h-12 w-auto object-contain"
            />
          </div>
        </div>

        {/* =========================================================
            CONTENT
        ========================================================= */}
        <div className="flex-1 px-5 py-7 sm:px-8 sm:py-10">
          {loading ? <Skeleton /> : <TermsContent router={router} />}
        </div>

        {/* =========================================================
            FOOTER
        ========================================================= */}
        {!loading && (
          <footer className="border-t border-gray-100 bg-gray-50 px-5 py-5 text-center sm:px-8">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} MediVision Eye Care Center. All
              Rights Reserved.
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Registration platform powered by SaaScraft Studio (India) Pvt.
              Ltd.
            </p>
          </footer>
        )}
      </div>
    </div>
  )
}

/* ===============================================================
   SKELETON LOADER
================================================================ */

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-3/4 rounded-lg bg-gray-200" />

      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-11/12 rounded bg-gray-200" />
        <div className="h-4 w-10/12 rounded bg-gray-200" />
      </div>

      <div className="space-y-3">
        <div className="h-5 w-1/3 rounded bg-gray-200" />
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-11/12 rounded bg-gray-200" />
      </div>

      <div className="space-y-3">
        <div className="h-5 w-1/3 rounded bg-gray-200" />
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-10/12 rounded bg-gray-200" />
      </div>
    </div>
  )
}

/* ===============================================================
   TERMS CONTENT
================================================================ */

function TermsContent({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <div className="space-y-7">
      {/* =========================================================
          TITLE
      ========================================================= */}
      <div className="border-b border-orange-100 pb-6">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-orange-600">
          MediVision Eye Care Center
        </p>

        <h1 className="text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
          PRACTITIONER'S CONCLAVE 2026
        </h1>

        <p className="mt-2 text-base font-medium text-gray-600">
          Registration – Terms & Conditions
        </p>
      </div>

      {/* =========================================================
          INTRODUCTION
      ========================================================= */}
      <p className="text-sm leading-6 text-gray-600 sm:text-base">
        By registering for{' '}
        <span className="font-semibold text-gray-800">
          PRACTITIONER'S CONCLAVE 2026
        </span>
        , organized by{' '}
        <span className="font-semibold text-gray-800">
          MediVision Eye Care Center
        </span>
        , you acknowledge that you have read, understood, and agreed to the
        following Terms & Conditions. Please review them carefully before
        completing your registration.
      </p>

      {/* =========================================================
          1. EVENT REGISTRATION
      ========================================================= */}
      <section>
        <SectionTitle>1. Event Registration</SectionTitle>

        <p className="text-sm leading-6 text-gray-600">
          Registration for PRACTITIONER'S CONCLAVE 2026 is subject to the
          eligibility requirements and availability determined by the
          organizers. All information submitted during registration must be
          accurate, complete, and up to date.
        </p>
      </section>

      {/* =========================================================
          2. PRACTITIONER INFORMATION
      ========================================================= */}
      <section>
        <SectionTitle>2. Practitioner Information</SectionTitle>

        <p className="text-sm leading-6 text-gray-600">
          Participants are required to provide accurate professional
          information, including their name, designation, institute, registered
          mobile number, email address, medical council registration number, and
          medical council state.
        </p>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          Participants are responsible for ensuring that the information
          provided belongs to them and is correct at the time of registration.
        </p>
      </section>

      {/* =========================================================
          3. REGISTRATION VALIDITY
      ========================================================= */}
      <section>
        <SectionTitle>3. Registration Validity</SectionTitle>

        <p className="text-sm leading-6 text-gray-600">
          Each registration is personal to the registered practitioner and is
          non-transferable unless otherwise approved by the organizers.
          Registration credentials should not be shared with another person.
        </p>
      </section>

      {/* =========================================================
          4. REGISTRATION NUMBER & QR CODE
      ========================================================= */}
      <section>
        <SectionTitle>4. Registration Number & QR Code</SectionTitle>

        <p className="text-sm leading-6 text-gray-600">
          Upon successful registration, a unique registration number and QR code
          may be generated for the participant. The QR code may be used for
          identity verification, attendance marking, and entry management at the
          event venue.
        </p>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          Participants are requested to keep their registration details and QR
          code accessible during the event.
        </p>
      </section>

      {/* =========================================================
          5. EMAIL & MOBILE
      ========================================================= */}
      <section>
        <SectionTitle>5. Email & Mobile Information</SectionTitle>

        <p className="text-sm leading-6 text-gray-600">
          A valid mobile number and email address must be provided during
          registration. Event-related communication, registration confirmation,
          updates, reminders, and other relevant information may be communicated
          using these details.
        </p>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          Participants are responsible for ensuring that the contact details
          provided during registration are accurate and accessible.
        </p>
      </section>

      {/* =========================================================
          6. DATA PRIVACY
      ========================================================= */}
      <section>
        <SectionTitle>6. Data Usage & Privacy</SectionTitle>

        <p className="text-sm leading-6 text-gray-600">
          Information collected during registration will be used for purposes
          related to event administration, participant verification,
          communication, attendance management, and other activities directly
          associated with PRACTITIONER'S CONCLAVE 2026.
        </p>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          Personal information will be handled in accordance with applicable
          privacy and data protection requirements. Information may be disclosed
          where required by law or necessary for legitimate event
          administration.
        </p>
      </section>

      {/* =========================================================
          7. EVENT CHANGES
      ========================================================= */}
      <section>
        <SectionTitle>7. Event Changes & Cancellation</SectionTitle>

        <p className="text-sm leading-6 text-gray-600">
          MediVision Eye Care Center reserves the right to modify the event
          schedule, speakers, venue, program, timings, or other event
          arrangements when circumstances require.
        </p>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          In the event of postponement, cancellation, or significant changes,
          participants will be informed through the contact details provided
          during registration wherever reasonably possible.
        </p>
      </section>

      {/* =========================================================
          8. ENTRY & CONDUCT
      ========================================================= */}
      <section>
        <SectionTitle>8. Entry & Participant Conduct</SectionTitle>

        <p className="text-sm leading-6 text-gray-600">
          Participants may be required to present their registration
          confirmation, QR code, or other identification at the venue.
          Participants are expected to maintain professional and respectful
          conduct throughout the event.
        </p>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          The organizers reserve the right to deny or restrict entry in cases of
          misuse of registration credentials, inappropriate conduct, or
          violation of event policies.
        </p>
      </section>

      {/* =========================================================
          9. LIABILITY
      ========================================================= */}
      <section>
        <SectionTitle>9. Liability</SectionTitle>

        <p className="text-sm leading-6 text-gray-600">
          The organizers will make reasonable efforts to conduct the event as
          planned. However, MediVision Eye Care Center shall not be responsible
          for delays, modifications, cancellation, or inconvenience arising from
          circumstances beyond its reasonable control.
        </p>
      </section>

      {/* =========================================================
          10. AMENDMENTS
      ========================================================= */}
      <section>
        <SectionTitle>10. Amendments to Terms</SectionTitle>

        <p className="text-sm leading-6 text-gray-600">
          These Terms & Conditions may be updated or modified when necessary.
          Any updated version published on the registration platform will
          supersede previous versions. Continued participation in the
          registration process constitutes acceptance of the applicable terms.
        </p>
      </section>

      {/* =========================================================
          ACCEPT
      ========================================================= */}
      <div className="border-t border-orange-100 pt-8">
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
          <p className="text-center text-sm leading-5 text-gray-600">
            Please confirm that you have read and agree to the Terms &
            Conditions before returning to the registration form.
          </p>
        </div>

        <div className="mt-6 flex justify-center">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="bg-orange-600 px-6 text-white shadow-sm hover:bg-orange-700">
                I Accept Terms & Conditions
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Acceptance</AlertDialogTitle>

                <AlertDialogDescription>
                  By confirming, you acknowledge that you have read, understood,
                  and agree to the Registration Terms & Conditions for
                  PRACTITIONER'S CONCLAVE 2026 by MediVision Eye Care Center.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>

                <AlertDialogAction asChild>
                  <Button
                    className="bg-orange-600 text-white hover:bg-orange-700"
                    onClick={() => router.back()}
                  >
                    Confirm
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}

/* ===============================================================
   SECTION TITLE
================================================================ */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 text-base font-semibold text-gray-800">{children}</h2>
  )
}
