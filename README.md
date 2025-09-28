# NexCV Coach

NexCV Coach is a Next.js application that helps users build and improve resumes with AI-powered suggestions, OCR processing, multi-template support, and intelligent job-specific tailoring.

## Features

- **AI-Powered Resume Analysis**: Upload resumes in PDF, DOC, or DOCX format with intelligent text extraction
- **Smart Resume Tailoring**: Optimize resumes for specific job descriptions with ATS score improvement
- **Multiple Templates**: Choose from Modern, Professional, Creative, and Classic resume templates
- **OCR Processing**: Extract and parse resume content using Gemini AI Vision API
- **ATS Optimization**: Show before/after ATS scores with keyword enhancement
- **Real-time Preview**: Live preview of resume changes and template switching
- **Export Options**: Download tailored resumes as PDF

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB
- **AI Integration**: Google Gemini AI, Gemini Vision API
- **Authentication**: Clerk
- **File Processing**: Mammoth (DOCX), PDF processing
- **UI Components**: Custom components with Lucide icons

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/Gatt101/Resume-Coach.git
cd Resume-Coach
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env.local file
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
GEMINI_API_KEY=your_gemini_api_key
MONGODB_URI=your_mongodb_connection_string
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Key Features

### Resume Upload & Processing
- Drag-and-drop file upload
- Support for PDF, DOC, DOCX formats
- AI-powered text extraction and parsing
- Automatic resume data structuring

### Job-Specific Tailoring
- Paste job descriptions for analysis
- Keyword extraction and optimization
- ATS score calculation and improvement
- Before/after comparison with metrics

### Template System
- Multiple professional templates
- Real-time template switching
- Responsive design for all devices
- Print-optimized layouts

## Project Structure

```
/app
  /api
    /resume/tailor     # Resume tailoring API
    /user/upload       # File upload processing
  /dashboard
    /tailor           # Resume tailoring interface
    /builder          # Resume builder
/components
  /resume-templates   # Template components
  /ui                # Reusable UI components
/lib                 # Utilities and database
/models              # MongoDB schemas
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

