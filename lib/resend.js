// lib/resend.js
import { Resend as ResendClient } from 'resend';

const resend = new ResendClient(process.env.RESEND_API_KEY);

export default resend;
