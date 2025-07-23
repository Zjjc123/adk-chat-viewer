import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data = formData.get('data') as string;
    const filename = formData.get('filename') as string || 'download.pdf';

    // Clean up the base64 string if needed
    let base64Data = data;
    if (base64Data.includes(',')) {
      base64Data = base64Data.split(',')[1];
    }

    // Remove any whitespace or line breaks
    base64Data = base64Data.replace(/[\s\r\n]+/g, '');

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Set headers for PDF download
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Content-Length', buffer.length.toString());

    // Return the file as a response
    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error in download-pdf route:', error);
    return NextResponse.json(
      { error: 'Failed to process PDF download' },
      { status: 500 }
    );
  }
} 