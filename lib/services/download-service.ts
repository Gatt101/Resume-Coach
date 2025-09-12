import jsPDF from 'jspdf';
import type { UnifiedEnhancedResumeData } from './unified-ai-service';

export class DownloadService {

    async downloadAsPDF(resumeData: UnifiedEnhancedResumeData, filename: string = 'resume'): Promise<void> {
        try {
            console.log('📄 DOWNLOAD: Starting PDF generation');

            const pdf = new jsPDF();
            let yPosition = 20;
            const lineHeight = 7;
            const pageHeight = pdf.internal.pageSize.height;
            const margin = 20;

            // Helper function to add text with word wrapping
            const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
                if (yPosition > pageHeight - margin) {
                    pdf.addPage();
                    yPosition = 20;
                }

                pdf.setFontSize(fontSize);
                if (isBold) {
                    pdf.setFont('helvetica', 'bold');
                } else {
                    pdf.setFont('helvetica', 'normal');
                }

                const lines = pdf.splitTextToSize(text, pdf.internal.pageSize.width - 2 * margin);
                pdf.text(lines, margin, yPosition);
                yPosition += lines.length * lineHeight;
            };

            // Header
            addText(resumeData.name, 20, true);
            addText(`${resumeData.email} | ${resumeData.phone}`, 12);
            addText(resumeData.location, 12);
            yPosition += 10;

            // Summary
            addText('PROFESSIONAL SUMMARY', 14, true);
            addText(resumeData.summary, 11);
            yPosition += 10;

            // Experience
            if (resumeData.experience.length > 0) {
                addText('PROFESSIONAL EXPERIENCE', 14, true);
                resumeData.experience.forEach(exp => {
                    addText(`${exp.title} - ${exp.company}`, 12, true);
                    addText(exp.years, 11);
                    addText(exp.description, 11);
                    exp.achievements.forEach(achievement => {
                        addText(`• ${achievement}`, 11);
                    });
                    yPosition += 5;
                });
            }

            // Skills
            if (resumeData.skills.length > 0) {
                addText('SKILLS', 14, true);
                addText(resumeData.skills.join(', '), 11);
                yPosition += 10;
            }

            // Education
            if (resumeData.education) {
                addText('EDUCATION', 14, true);
                addText(resumeData.education, 11);
                yPosition += 10;
            }

            // Projects
            if (resumeData.projects.length > 0) {
                addText('PROJECTS', 14, true);
                resumeData.projects.forEach(project => {
                    addText(project.name, 12, true);
                    addText(project.description, 11);
                    if (project.technologies.length > 0) {
                        addText(`Technologies: ${project.technologies.join(', ')}`, 10);
                    }
                    yPosition += 5;
                });
            }

            // Certifications
            if (resumeData.certifications.length > 0) {
                addText('CERTIFICATIONS', 14, true);
                resumeData.certifications.forEach(cert => {
                    addText(`• ${cert}`, 11);
                });
            }

            // Save the PDF
            pdf.save(`${filename}.pdf`);
            console.log('✅ DOWNLOAD: PDF generated successfully');

        } catch (error) {
            console.error('💥 DOWNLOAD: PDF generation failed:', error);
            throw new Error('Failed to generate PDF');
        }
    }

    async downloadAsDOCX(resumeData: UnifiedEnhancedResumeData, filename: string = 'resume'): Promise<void> {
        try {
            console.log('📄 DOWNLOAD: Starting Word document generation (RTF format)');

            // Create RTF content (Rich Text Format - compatible with Word)
            let rtfContent = '{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}\\f0';

            // Header
            rtfContent += `\\fs28\\b ${resumeData.name}\\b0\\par`;
            rtfContent += `\\fs20 ${resumeData.email} | ${resumeData.phone}\\par`;
            rtfContent += `${resumeData.location}\\par\\par`;

            // Summary
            rtfContent += `\\fs24\\b PROFESSIONAL SUMMARY\\b0\\par`;
            rtfContent += `\\fs20 ${resumeData.summary}\\par\\par`;

            // Experience
            if (resumeData.experience.length > 0) {
                rtfContent += `\\fs24\\b PROFESSIONAL EXPERIENCE\\b0\\par`;
                resumeData.experience.forEach(exp => {
                    rtfContent += `\\fs22\\b ${exp.title} - ${exp.company}\\b0\\par`;
                    rtfContent += `\\fs20\\i ${exp.years}\\i0\\par`;
                    rtfContent += `${exp.description}\\par`;
                    exp.achievements.forEach(achievement => {
                        rtfContent += `• ${achievement}\\par`;
                    });
                    rtfContent += '\\par';
                });
            }

            // Skills
            if (resumeData.skills.length > 0) {
                rtfContent += `\\fs24\\b SKILLS\\b0\\par`;
                rtfContent += `\\fs20 ${resumeData.skills.join(', ')}\\par\\par`;
            }

            // Education
            if (resumeData.education) {
                rtfContent += `\\fs24\\b EDUCATION\\b0\\par`;
                rtfContent += `\\fs20 ${resumeData.education}\\par\\par`;
            }

            // Projects
            if (resumeData.projects.length > 0) {
                rtfContent += `\\fs24\\b PROJECTS\\b0\\par`;
                resumeData.projects.forEach(project => {
                    rtfContent += `\\fs22\\b ${project.name}\\b0\\par`;
                    rtfContent += `\\fs20 ${project.description}\\par`;
                    if (project.technologies.length > 0) {
                        rtfContent += `\\i Technologies: ${project.technologies.join(', ')}\\i0\\par`;
                    }
                    rtfContent += '\\par';
                });
            }

            // Certifications
            if (resumeData.certifications.length > 0) {
                rtfContent += `\\fs24\\b CERTIFICATIONS\\b0\\par`;
                resumeData.certifications.forEach(cert => {
                    rtfContent += `\\fs20 • ${cert}\\par`;
                });
            }

            rtfContent += '}';

            // Download as RTF file (opens in Word)
            const blob = new Blob([rtfContent], { type: 'application/rtf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filename}.rtf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            console.log('✅ DOWNLOAD: RTF (Word-compatible) generated successfully');

        } catch (error) {
            console.error('💥 DOWNLOAD: RTF generation failed:', error);
            throw new Error('Failed to generate Word document');
        }
    }

    async downloadAsText(resumeData: UnifiedEnhancedResumeData, filename: string = 'resume'): Promise<void> {
        try {
            console.log('📄 DOWNLOAD: Starting TXT generation');

            let content = '';

            // Header
            content += `${resumeData.name}\n`;
            content += `${resumeData.email} | ${resumeData.phone}\n`;
            content += `${resumeData.location}\n\n`;

            // Summary
            content += `PROFESSIONAL SUMMARY\n`;
            content += `${resumeData.summary}\n\n`;

            // Experience
            if (resumeData.experience.length > 0) {
                content += `PROFESSIONAL EXPERIENCE\n`;
                resumeData.experience.forEach(exp => {
                    content += `${exp.title} - ${exp.company}\n`;
                    content += `${exp.years}\n`;
                    content += `${exp.description}\n`;
                    exp.achievements.forEach(achievement => {
                        content += `• ${achievement}\n`;
                    });
                    content += '\n';
                });
            }

            // Skills
            if (resumeData.skills.length > 0) {
                content += `SKILLS\n`;
                content += `${resumeData.skills.join(', ')}\n\n`;
            }

            // Education
            if (resumeData.education) {
                content += `EDUCATION\n`;
                content += `${resumeData.education}\n\n`;
            }

            // Projects
            if (resumeData.projects.length > 0) {
                content += `PROJECTS\n`;
                resumeData.projects.forEach(project => {
                    content += `${project.name}\n`;
                    content += `${project.description}\n`;
                    if (project.technologies.length > 0) {
                        content += `Technologies: ${project.technologies.join(', ')}\n`;
                    }
                    content += '\n';
                });
            }

            // Certifications
            if (resumeData.certifications.length > 0) {
                content += `CERTIFICATIONS\n`;
                resumeData.certifications.forEach(cert => {
                    content += `• ${cert}\n`;
                });
            }

            // Download as text file
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filename}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            console.log('✅ DOWNLOAD: TXT generated successfully');

        } catch (error) {
            console.error('💥 DOWNLOAD: TXT generation failed:', error);
            throw new Error('Failed to generate TXT');
        }
    }
}

export const downloadService = new DownloadService();