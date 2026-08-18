import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Register from '@/lib/models/Register'
import sendEmail from '@/lib/utils/sendEmail'

export async function POST(req: Request) {
  try {
    await connectDB()

    const {
      name,
      designation,
      institute,
      mobileNo,
      emailId,
      medicalCouncilNo,
      medicalCouncilState,
    } = await req.json()

    // =========================================================
    // VALIDATION
    // =========================================================

    if (
      !name ||
      !designation ||
      !institute ||
      !mobileNo ||
      !emailId ||
      !medicalCouncilNo ||
      !medicalCouncilState
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'All fields are required',
        },
        { status: 400 },
      )
    }

    // =========================================================
    // CLEAN VALUES
    // =========================================================

    const cleanName = name.trim()
    const cleanDesignation = designation.trim()
    const cleanInstitute = institute.trim()
    const cleanMobileNo = mobileNo.trim()
    const cleanEmailId = emailId.trim().toLowerCase()
    const cleanMedicalCouncilNo = medicalCouncilNo.trim()
    const cleanMedicalCouncilState = medicalCouncilState.trim()

    // =========================================================
    // VALIDATE MOBILE NUMBER
    // =========================================================

    if (!/^\d{10}$/.test(cleanMobileNo)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Mobile No. must be 10 digits',
        },
        { status: 400 },
      )
    }

    // =========================================================
    // VALIDATE EMAIL
    // =========================================================

    if (!/^\S+@\S+\.\S+$/.test(cleanEmailId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please enter a valid Email ID',
        },
        { status: 400 },
      )
    }

    // =========================================================
    // CHECK EXISTING REGISTRATION
    // =========================================================

    const exists = await Register.findOne({
      $or: [{ mobileNo: cleanMobileNo }, { emailId: cleanEmailId }],
    })

    if (exists) {
      if (exists.mobileNo === cleanMobileNo) {
        return NextResponse.json(
          {
            success: false,
            message: 'Mobile No. already registered',
          },
          { status: 409 },
        )
      }

      if (exists.emailId === cleanEmailId) {
        return NextResponse.json(
          {
            success: false,
            message: 'Email ID already registered',
          },
          { status: 409 },
        )
      }
    }

    // =========================================================
    // GENERATE REGISTRATION NUMBER
    // =========================================================

    const last = await Register.findOne().sort({
      createdAt: -1,
    })

    let next = 1001

    if (last?.regNum) {
      const lastNumber = Number(last.regNum.split('-')[1])

      if (!isNaN(lastNumber)) {
        next = lastNumber + 1
      }
    }

    const regNum = `PCBMV-${next}`

    // =========================================================
    // GENERATE QR CODE
    // =========================================================

    const qrCode =
      `https://api.qrserver.com/v1/create-qr-code/` +
      `?size=500x500` +
      `&format=png` +
      `&margin=10` +
      `&data=${encodeURIComponent(regNum)}`

    // =========================================================
    // CREATE REGISTRATION
    // =========================================================

    const register = await Register.create({
      name: cleanName,
      designation: cleanDesignation,
      institute: cleanInstitute,
      mobileNo: cleanMobileNo,
      emailId: cleanEmailId,
      medicalCouncilNo: cleanMedicalCouncilNo,
      medicalCouncilState: cleanMedicalCouncilState,

      // Registration / QR
      regNum,
      generateQR: true,

      // Attendance
      dayOne: null,
      dayTwo: null,
    })

    // =========================================================
    // SEND CONFIRMATION EMAIL
    // =========================================================

    await sendEmail({
      // Main recipient
      to: cleanEmailId,

      // Recipient name
      name: cleanName,

      // ZeptoMail template
      templateKey:
        '2518b.554b0da719bc314.k1.f9413ab1-9af6-11f1-bd88-62df313bf14d.1a0149af9d9',

      // BCC recipients requested by client
      bcc: ['bdm@medivisioneyecare.com', 'jaaved@medconevents.in'],

      // Template merge fields
      mergeInfo: {
        name: cleanName,
        regNum,
        qrCode,
      },
    })

    // =========================================================
    // SUCCESS RESPONSE
    // =========================================================

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful',
        data: register,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('REGISTER ERROR:', error)

    // =========================================================
    // MONGODB DUPLICATE KEY ERROR
    // =========================================================

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Mobile No. or Email ID is already registered',
        },
        { status: 409 },
      )
    }

    // =========================================================
    // SERVER ERROR
    // =========================================================

    return NextResponse.json(
      {
        success: false,
        message: 'Server error',
      },
      { status: 500 },
    )
  }
}

// =============================================================
// GET ALL REGISTRATIONS
// =============================================================

export async function GET() {
  try {
    await connectDB()

    const data = await Register.find().sort({
      createdAt: -1,
    })

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('GET REGISTER ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Server error',
      },
      { status: 500 },
    )
  }
}
