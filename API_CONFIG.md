# API Configuration

## Try-On API Integration

The React app is configured to call the Next.js try-on API. 

### API URL Configuration

The API URL can be configured in two ways:

1. **Environment Variable (Recommended)**
   - Create a `.env` file in the `dulira_shopify_app` directory
   - Add: `VITE_API_URL=http://localhost:3000/api/tryon`
   - Replace `http://localhost:3000` with your actual Next.js server URL

2. **Default Fallback**
   - If no environment variable is set, it defaults to: `http://localhost:3000/api/tryon`
   - You can change this in `src/App.jsx` line 86

### Product Image URL

The product image URL is read from the global variable set in `index.html`:
```html
<script>
  window.productImageUrl = "YOUR_PRODUCT_IMAGE_URL";
</script>
```

### How It Works

1. User uploads their photo in the try-on modal
2. User clicks "Unblur" button
3. User enters their email
4. When user clicks "Continue", the app:
   - Calls the try-on API with the product image URL and user's photo
   - Shows a loading state ("Generating...")
   - Displays the generated try-on image in a popup modal
   - Shows the generated image in step 3

### API Endpoint

**URL:** `POST /api/tryon`

**Request:**
- `productImageUrl` (string): URL of the product image
- `personImage` (file): User's uploaded image file

**Response:**
```json
{
  "success": true,
  "message": "Virtual try-on processed successfully",
  "generatedImageBase64": "base64_encoded_image_string"
}
```

### Troubleshooting

- **CORS Issues**: Make sure your Next.js API allows requests from your React app's origin
- **API Not Found**: Verify the API URL is correct and the Next.js server is running
- **Image Not Generating**: Check the Next.js server logs for errors

