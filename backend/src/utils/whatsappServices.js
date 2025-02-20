import twilio from 'twilio'
import dotenv from 'dotenv'

dotenv.config()

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
)

const sendWhatsApp = async (to, message) => {
    try {
        await client.messages.create({
            from: process.env.TWILIO_WHATSAPP_NUMBER,
            to: `message:${to}`,
            body: message,
        })
        console.log(`WhatsApp message sent to ${to}`)
    } catch (error) {
        console.error('Error sending WhatsApp message:', error)
    }
}

export { sendWhatsApp }
