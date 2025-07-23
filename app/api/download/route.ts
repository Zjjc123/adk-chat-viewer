import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data = formData.get('filedata') as string;
    const filename = formData.get('filename') as string || 'download';
    const mimeType = formData.get('mimetype') as string || 'application/octet-stream';

    // Clean up the base64 string if needed
    let base64Data = data;
    if (base64Data.includes(',')) {
      base64Data = base64Data.split(',')[1];
    }

    // Remove any whitespace or line breaks
    base64Data = base64Data.replace(/[\s\r\n]+/g, '');

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Set headers for file download
    const headers = new Headers();
    headers.set('Content-Type', mimeType);
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Content-Length', buffer.length.toString());

    // Return the file as a response
    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error in download route:', error);
    return NextResponse.json(
      { error: 'Failed to process file download' },
      { status: 500 }
    );
  }
} 