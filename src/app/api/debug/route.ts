import { NextResponse } from 'next/server';

export async function GET() {
  const checks = {
    huggingface_key: !!process.env.HUGGINGFACE_API_KEY,
    postgres_url: !!process.env.POSTGRES_URL,
    huggingface_key_length: process.env.HUGGINGFACE_API_KEY?.length || 0,
  };

  return NextResponse.json(checks);
}
