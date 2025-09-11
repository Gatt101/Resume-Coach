import { NextRequest } from 'next/server'
import { CreateResume, UpdateResume, DeleteResume, GetUserResumes } from '@/lib/actions/resume.action'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: NextRequest) {
    try {
        // Get the authenticated user
        const { userId } = await auth()
        
        if (!userId) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
        }
        
        const { resume, template } = await req.json()
        
        if (!resume) {
            return new Response(JSON.stringify({ error: 'Resume data is required' }), { status: 400 })
        }

        const newResume = await CreateResume(userId, resume, template || 'modern')
        return new Response(JSON.stringify({ 
            success: true, 
            resume: newResume,
            message: 'Resume saved successfully!' 
        }), { status: 201 })
        
    } catch (error) {
        console.error('Error creating resume:', error)
        return new Response(JSON.stringify({ error: 'Failed to create resume' }), { status: 500 })
    }
}

export async function GET(req: NextRequest) {
    try {
        // Get the authenticated user
        const { userId } = await auth()
        
        if (!userId) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
        }

        const resumes = await GetUserResumes(userId)
        return new Response(JSON.stringify({ 
            success: true, 
            resumes 
        }), { status: 200 })
        
    } catch (error) {
        console.error('Error fetching resumes:', error)
        return new Response(JSON.stringify({ error: 'Failed to fetch resumes' }), { status: 500 })
    }
}

export async function PUT(req: NextRequest) {
    try {
        // Get the authenticated user
        const { userId } = await auth()
        
        if (!userId) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
        }

        const { resumeId, resumeData, template } = await req.json()
        
        if (!resumeId || !resumeData) {
            return new Response(JSON.stringify({ error: 'Resume ID and data are required' }), { status: 400 })
        }

        const updatedResume = await UpdateResume(userId, resumeId, resumeData, template)
        
        if (!updatedResume) {
            return new Response(JSON.stringify({ error: 'Resume not found' }), { status: 404 })
        }

        return new Response(JSON.stringify({ 
            success: true, 
            resume: updatedResume,
            message: 'Resume updated successfully!' 
        }), { status: 200 })
        
    } catch (error) {
        console.error('Error updating resume:', error)
        return new Response(JSON.stringify({ error: 'Failed to update resume' }), { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    try {
        // Get the authenticated user
        const { userId } = await auth()
        
        if (!userId) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
        }

        const { resumeId } = await req.json()
        
        if (!resumeId) {
            return new Response(JSON.stringify({ error: 'Resume ID is required' }), { status: 400 })
        }

        await DeleteResume(userId, resumeId)
        return new Response(JSON.stringify({ 
            success: true,
            message: 'Resume deleted successfully!' 
        }), { status: 200 })
        
    } catch (error) {
        console.error('Error deleting resume:', error)
        return new Response(JSON.stringify({ error: 'Failed to delete resume' }), { status: 500 })
    }
}