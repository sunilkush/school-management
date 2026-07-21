import { HiOutlineChatBubbleLeftRight, HiOutlineCodeBracket, HiOutlineEnvelope } from 'react-icons/hi2'
import { SiGoogledrive, SiGooglemeet, SiRazorpay, SiStripe, SiWhatsapp, SiZoom } from 'react-icons/si'
import { FaMicrosoft, FaSlack } from 'react-icons/fa6'
import type { Integration } from '@/types/content'

// isLive reflects what's actually wired in the product today — keep this
// honest as real integrations ship; don't flip to true speculatively.
export const INTEGRATIONS: Integration[] = [
  { id: 'whatsapp', name: 'WhatsApp', icon: SiWhatsapp, isLive: true },
  { id: 'sms', name: 'SMS', icon: HiOutlineChatBubbleLeftRight, isLive: true },
  { id: 'email', name: 'Email', icon: HiOutlineEnvelope, isLive: true },
  { id: 'razorpay', name: 'Razorpay', icon: SiRazorpay, isLive: true },
  { id: 'api', name: 'API', icon: HiOutlineCodeBracket, isLive: true },
  { id: 'google-meet', name: 'Google Meet', icon: SiGooglemeet, isLive: false },
  { id: 'zoom', name: 'Zoom', icon: SiZoom, isLive: false },
  { id: 'stripe', name: 'Stripe', icon: SiStripe, isLive: false },
  { id: 'google-drive', name: 'Google Drive', icon: SiGoogledrive, isLive: false },
  { id: 'microsoft', name: 'Microsoft 365', icon: FaMicrosoft, isLive: false },
  { id: 'slack', name: 'Slack', icon: FaSlack, isLive: false },
]
