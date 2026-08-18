import { SendMailClient } from 'zeptomail'

const client = new SendMailClient({
  url: process.env.ZEPTO_URL!,
  token: process.env.ZEPTO_TOKEN!,
})

// Send ZeptoMail Template Email
const sendEmail = async ({
  to,
  name,
  templateKey,
  mergeInfo = {},
}: {
  to: string
  name: string
  subject?: string
  templateKey: string
  mergeInfo?: Record<string, any>
}) => {
  try {
    if (!to) {
      throw new Error('Recipient email is required.')
    }

    if (!templateKey) {
      throw new Error('Template key is required.')
    }

    if (!process.env.ZEPTO_URL) {
      throw new Error('ZEPTO_URL is not configured.')
    }

    if (!process.env.ZEPTO_TOKEN) {
      throw new Error('ZEPTO_TOKEN is not configured.')
    }

    if (!process.env.ZEPTO_FROM) {
      throw new Error('ZEPTO_FROM is not configured.')
    }

    const response = await client.sendMailWithTemplate({
      mail_template_key: templateKey,

      from: {
        address: process.env.ZEPTO_FROM,
        name: 'MediVision',
      },

      to: [
        {
          email_address: {
            address: to,
            name,
          },
        },
      ],

      merge_info: mergeInfo,
    })

    return response
  } catch (error) {
    console.error('ZeptoMail Error:', JSON.stringify(error, null, 2))

    throw error
  }
}

export default sendEmail
