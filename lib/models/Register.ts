import mongoose, { Schema, models } from 'mongoose'

const RegisterSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    designation: {
      type: String,
      required: true,
      trim: true,
    },

    institute: {
      type: String,
      required: true,
      trim: true,
    },

    mobileNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^\d{10}$/, 'Mobile No. must be 10 digits'],
    },

    emailId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid Email ID'],
    },

    medicalCouncilNo: {
      type: String,
      required: true,
      trim: true,
    },

    medicalCouncilState: {
      type: String,
      required: true,
      trim: true,
    },

    // Used for generating/identifying registration
    regNum: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },

    // Used for QR generation/scanning
    generateQR: {
      type: Boolean,
      default: false,
    },

    // Attendance / Day 1 scanning
    dayOne: {
      type: String,
      default: null,
      trim: true,
    },

    // Attendance / Day 2 scanning
    dayTwo: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
)

export default models.Register || mongoose.model('Register', RegisterSchema)
