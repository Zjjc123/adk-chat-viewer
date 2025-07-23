import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { marked } from 'marked';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Check if this is a markdown-to-PDF request
    if (formData.has('markdown')) {
      const markdown = formData.get('markdown') as string;
      const filename = formData.get('filename') as string || 'document.pdf';
      
      if (!markdown) {
        return NextResponse.json({ error: 'No markdown content provided' }, { status: 400 });
      }
      
      // Convert markdown to HTML
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Chat Export</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            h1 { font-size: 24px; margin-top: 24px; margin-bottom: 16px; font-weight: 600; }
            h2 { font-size: 20px; margin-top: 24px; margin-bottom: 16px; font-weight: 600; }
            h3 { font-size: 18px; margin-top: 24px; margin-bottom: 16px; font-weight: 600; }
            p { margin-top: 0; margin-bottom: 16px; }
            code, pre {
              font-family: SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace;
              padding: 0.2em 0.4em;
              margin: 0;
              font-size: 85%;
              background-color: rgba(27, 31, 35, 0.05);
              border-radius: 3px;
            }
            pre {
              padding: 16px;
              overflow: auto;
              line-height: 1.45;
            }
            pre code {
              background-color: transparent;
              padding: 0;
            }
            blockquote {
              padding: 0 1em;
              color: #6a737d;
              border-left: 0.25em solid #dfe2e5;
              margin: 0 0 16px 0;
            }
            hr {
              height: 0.25em;
              padding: 0;
              margin: 24px 0;
              background-color: #e1e4e8;
              border: 0;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin-bottom: 16px;
            }
            table th, table td {
              padding: 6px 13px;
              border: 1px solid #dfe2e5;
            }
            table tr { background-color: #fff; }
            table tr:nth-child(2n) { background-color: #f6f8fa; }
            img { max-width: 100%; }
          </style>
        </head>
        <body>
          ${marked(markdown)}
        </body>
        </html>
      `;
      
      // Generate PDF using Puppeteer
      const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Generate PDF
      const pdf = await page.pdf({
        format: 'A4',
        margin: {
          top: '30px',
          right: '30px',
          bottom: '30px',
          left: '30px'
        },
        printBackground: true
      });
      
      await browser.close();
      
      // Return PDF as response
      return new NextResponse(pdf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } 
    // Original PDF file download functionality
    else {
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
    }
  } catch (error) {
    console.error('Error in download-pdf route:', error);
    return NextResponse.json(
      { error: 'Failed to process PDF download' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 