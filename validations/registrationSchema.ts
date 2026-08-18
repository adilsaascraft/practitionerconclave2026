import { z } from 'zod'

/* -------------------- MAIN SCHEMA -------------------- */

export const EVEventRegistrationSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),

  designation: z.string().trim().min(2, 'Designation is required'),

  institute: z.string().trim().min(2, 'Institute is required'),

  mobileNo: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid Indian mobile number'),

  emailId: z.string().trim().email('Enter a valid Email ID'),

  medicalCouncilNo: z.string().trim().min(1, 'Medical Council No. is required'),

  medicalCouncilState: z
    .string()
    .trim()
    .min(2, 'Medical Council State is required'),
})

/* -------------------- TYPE -------------------- */

export type EVEventRegistrationForm = z.output<typeof EVEventRegistrationSchema>
