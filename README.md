# AI Image Generator

A modern, responsive AI image generator using Nano Banana model through OpenRouter API.

## Features

- 🎨 Multiple design styles (Birthday, Wedding, Social Media, etc.)
- 📐 5 aspect ratios (9:16, 1:1, 16:9, 3:4, 4:3)
- 🖼️ Multiple image upload with background removal
- 🤖 AI concept generation
- 🎯 Image refinement and variations
- 💾 Gallery for saving creations
- 📱 Fully responsive design

## Setup Instructions

### 1. Upload to GitHub

1. Create a new repository on GitHub
2. Upload all the files to your repository
3. Commit and push the changes

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure environment variables:
   - Add `OPENROUTER_API_KEY` with your OpenRouter API key
5. Click "Deploy"

### 3. Configure OpenRouter API Key

1. Get your API key from [OpenRouter](https://openrouter.ai)
2. In Vercel dashboard, go to your project settings
3. Navigate to "Environment Variables"
4. Add a new variable:
   - Name: `OPENROUTER_API_KEY`
   - Value: `your-actual-api-key-here`
5. Redeploy your application

## File Structure
## Usage

1. **Upload Images**: Drag & drop or click to upload reference images
2. **Analyze**: Remove backgrounds from uploaded images
3. **Select Style**: Choose from various design styles and aspect ratios
4. **Generate Concept**: Let AI create a creative prompt or use your own
5. **Generate Image**: Create your AI-powered image
6. **Refine**: Make adjustments and generate variations
7. **Save**: Download or save to your gallery

## Technologies Used

- HTML5, CSS3, JavaScript (ES6+)
- OpenRouter API for AI model access
- Nano Banana model for image generation
- Vercel for deployment
- Local Storage for gallery management

## Support

For issues with deployment or API configuration, check:
- Vercel documentation
- OpenRouter API documentation
- Browser console for error messages
