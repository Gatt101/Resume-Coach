# AI Resume Builder API Usage Guide

## Overview
The enhanced AI Resume Builder uses Inngest for powerful, scalable resume generation with AI agents. The system provides both synchronous and asynchronous resume generation capabilities.

## API Endpoints

### 1. Synchronous Resume Generation (Recommended for quick results)
**Endpoint:** `PUT /api/resume/generate`
**Method:** PUT
**Description:** Generates a resume immediately using the AI agent

#### Request Body:
```json
{
  "description": "I'm a software engineer with 5 years of experience in React, Node.js, and AWS. I've worked at tech startups and built scalable web applications.",
  "template": "modern",
  "targetRole": "Senior Software Engineer", 
  "experienceLevel": "senior"
}
```

#### Response:
```json
{
  "success": true,
  "resume": {
    "name": "Professional Candidate",
    "email": "professional.candidate@email.com",
    "phone": "(555) 123-4567",
    "location": "Professional Location",
    "summary": "Senior professional with expertise in software development...",
    "experience": [...],
    "skills": [...],
    "education": "...",
    "projects": [...],
    "certifications": [...],
    "metadata": {
      "template": "modern",
      "generatedAt": "2024-01-01T00:00:00.000Z",
      "targetRole": "Senior Software Engineer",
      "experienceLevel": "senior",
      "colorScheme": "blue",
      "layout": "clean"
    }
  }
}
```

### 2. Asynchronous Resume Generation (For complex processing)
**Endpoint:** `POST /api/resume/generate`
**Method:** POST
**Description:** Triggers async resume generation using Inngest

#### Request Body:
```json
{
  "description": "I'm a data scientist with machine learning expertise...",
  "template": "professional",
  "targetRole": "Data Scientist",
  "experienceLevel": "mid"
}
```

#### Response:
```json
{
  "success": true,
  "eventId": "01HXXX...",
  "message": "Resume generation started. This is an async process.",
  "status": "processing"
}
```

### 3. Check Resume Generation Status
**Endpoint:** `GET /api/resume/status?eventId=01HXXX...`
**Method:** GET
**Description:** Check the status of async resume generation

#### Response:
```json
{
  "eventId": "01HXXX...",
  "status": "completed",
  "result": {
    "success": true,
    "resume": { /* Full resume object */ }
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "completedAt": "2024-01-01T00:00:30.000Z"
}
```

## Request Parameters

### Required Parameters:
- **description** (string): Detailed description of the candidate's background, experience, and career goals

### Optional Parameters:
- **template** (string): Resume template style
  - Options: "modern", "creative", "professional", "classic"
  - Default: "modern"

- **targetRole** (string): The specific role the candidate is targeting
  - Examples: "Software Engineer", "Data Scientist", "Marketing Manager"
  - Default: "general"

- **experienceLevel** (string): Candidate's experience level
  - Options: "entry", "mid", "senior", "lead", "executive"
  - Default: "mid"

## Example Usage

### Frontend Integration (React/Next.js):
```javascript
// Synchronous generation (recommended)
const generateResume = async (formData) => {
  try {
    const response = await fetch('/api/resume/generate', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: formData.description,
        template: formData.template,
        targetRole: formData.targetRole,
        experienceLevel: formData.experienceLevel
      })
    });
    
    const data = await response.json();
    if (data.success) {
      setResume(data.resume);
    }
  } catch (error) {
    console.error('Resume generation failed:', error);
  }
};

// Asynchronous generation with polling
const generateResumeAsync = async (formData) => {
  try {
    // Start generation
    const response = await fetch('/api/resume/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const { eventId } = await response.json();
    
    // Poll for status
    const pollStatus = async () => {
      const statusResponse = await fetch(`/api/resume/status?eventId=${eventId}`);
      const status = await statusResponse.json();
      
      if (status.status === 'completed') {
        setResume(status.result.resume);
      } else if (status.status === 'failed') {
        setError('Resume generation failed');
      } else {
        setTimeout(pollStatus, 2000); // Poll every 2 seconds
      }
    };
    
    pollStatus();
  } catch (error) {
    console.error('Resume generation failed:', error);
  }
};
```

## AI Agent Features

The enhanced AI Resume Builder includes:

1. **Industry-Specific Optimization**: Tailors content based on target role and industry
2. **ATS Optimization**: Includes relevant keywords for applicant tracking systems
3. **Experience Level Awareness**: Adjusts tone and content based on career stage
4. **Template-Specific Formatting**: Optimizes content for different resume styles
5. **Structured Output**: Uses Zod schema validation for consistent results
6. **Enhanced Fallback**: Intelligent mock data generation when AI is unavailable

## Error Handling

The API includes comprehensive error handling:

- **400 Bad Request**: Missing required parameters
- **500 Internal Server Error**: AI generation failures with fallback to enhanced mock data
- **Validation Errors**: Zod schema validation ensures data integrity

## Environment Variables

Make sure to set the following environment variables:

```env
GEMINI_API_KEY=your_gemini_api_key_here
INNGEST_API_KEY=your_inngest_api_key_here
```

## Best Practices

1. **Use Synchronous API (PUT)** for most use cases - it's faster and more reliable
2. **Provide Detailed Descriptions**: More context leads to better resume generation
3. **Specify Target Role**: Helps the AI optimize keywords and content structure
4. **Handle Errors Gracefully**: Always implement fallback UI for failed generations
5. **Cache Results**: Consider caching generated resumes to avoid repeated API calls

## Template Styles

Each template includes specific styling metadata:

- **Modern**: Clean, blue color scheme with modern layout
- **Creative**: Artistic, purple color scheme with creative layout  
- **Professional**: Traditional, navy color scheme with professional layout
- **Classic**: Minimal, black color scheme with classic layout
