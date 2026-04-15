import { NextResponse } from 'next/server';
import { getAuthUrl } from '../../../../utils/pinterest';

export async function GET() {
  const url = getAuthUrl();
  return NextResponse.redirect(url);
}
