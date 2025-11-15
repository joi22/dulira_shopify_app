import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Enable CORS for React app
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const productImageUrl = formData.get('productImageUrl') as string;
    const personImage = formData.get('personImage') as File;

    if (!productImageUrl || !personImage) {
      return NextResponse.json(
        { error: 'Both productImageUrl and personImage are required' },
        { status: 400 }
      );
    }

    // Convert product image URL to base64 (preserve quality)
    const productImageData = await urlToBase64WithMimeType(productImageUrl);
    const productImageBase64 = productImageData.base64;
    const productMimeType = normalizeMimeType(productImageData.mimeType);

    // Convert person image to base64 (preserve original quality)
    const personBuffer = await personImage.arrayBuffer();
    const personImageBase64 = Buffer.from(personBuffer).toString('base64');
    // Use original MIME type to preserve quality, normalize jpg to jpeg
    const personMimeType = normalizeMimeType(personImage.type || 'image/jpeg');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Use the confirmed working image model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });

    // Prompt for try-on
    const prompt = `You are a virtual try-on AI assistant.
Analyze the product image and the person's image, and generate a realistic virtual try-on image with correct placement, lighting, and proportion.`;

    // Prepare contents - array of parts directly (not nested in parts property)
    // Use actual MIME types to preserve image quality
    const contents = [
      { inlineData: { mimeType: productMimeType, data: productImageBase64 } },
      { inlineData: { mimeType: personMimeType, data: personImageBase64 } },
      { text: prompt },
    ];

    // Generate the image
    const result = await model.generateContent(contents);
    const response = await result.response;

    // Extract generated image from response
    // Check if response contains image data in parts
    const generatedImageBase64 = response.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.inlineData
    )?.inlineData?.data;

    if (!generatedImageBase64) {
      throw new Error('No image returned from Gemini.');
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Virtual try-on processed successfully',
        generatedImageBase64,
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error: any) {
    console.error('Error processing virtual try-on:', error);
    return NextResponse.json(
      {
        error: 'Failed to process virtual try-on',
        details: error.message,
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
}

// Helper: normalize MIME type (convert image/jpg to image/jpeg)
function normalizeMimeType(mimeType: string): string {
  // Convert image/jpg to image/jpeg (Gemini API requirement)
  if (mimeType === 'image/jpg') {
    return 'image/jpeg';
  }
  return mimeType;
}

// Helper: convert image URL to base64 with MIME type detection (preserves quality)
async function urlToBase64WithMimeType(url: string): Promise<{ base64: string; mimeType: string }> {
  // Prepare headers for external CDN requests
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'image/*,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  };
  
  // Try to add Referer header, but don't fail if URL parsing fails
  try {
    const urlObj = new URL(url);
    headers['Referer'] = urlObj.origin;
  } catch (e) {
    // If URL parsing fails, continue without Referer header
  }
  
  // Fetch with proper headers to avoid CORS/blocking issues with external CDNs
  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }
  
  // Get MIME type from Content-Type header or detect from URL extension
  let mimeType = response.headers.get('content-type') || '';
  
  // Remove any charset or other parameters from MIME type (e.g., "image/jpeg; charset=utf-8" -> "image/jpeg")
  if (mimeType.includes(';')) {
    mimeType = mimeType.split(';')[0].trim();
  }
  
  // If no MIME type in header, detect from URL extension
  if (!mimeType || !mimeType.startsWith('image/')) {
    const urlLower = url.toLowerCase();
    if (urlLower.includes('.png')) mimeType = 'image/png';
    else if (urlLower.includes('.webp')) mimeType = 'image/webp';
    else if (urlLower.includes('.gif')) mimeType = 'image/gif';
    else mimeType = 'image/jpeg'; // Default fallback
  }
  
  // Ensure it's a valid image MIME type
  if (!mimeType.startsWith('image/')) {
    mimeType = 'image/jpeg';
  }
  
  // Convert to base64 without any compression or modification
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  
  return { base64, mimeType };
}
