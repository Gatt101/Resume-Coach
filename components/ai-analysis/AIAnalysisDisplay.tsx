"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  AlertTriangle, 
  Lightbulb, 
  Target,
  TrendingUp,
  BookOpen,
  Briefcase,
  Award
} from "lucide-react";
import type { ResumeAnalysis } from "@/lib/services/ai-resume-service";

interface AIAnalysisDisplayProps {
  analysis: ResumeAnalysis;
}

export function AIAnalysisDisplay({ analysis }: AIAnalysisDisplayProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Overall Resume Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`text-4xl font-bold ${getScoreColor(analysis.overallScore)}`}>
              {analysis.overallScore}%
            </div>
            <div className="flex-1">
              <Progress value={analysis.overallScore} className="h-3" />
              <p className="text-sm text-gray-600 mt-2">
                {analysis.overallScore >= 80 ? "Excellent match!" : 
                 analysis.overallScore >= 60 ? "Good foundation, room for improvement" : 
                 "Needs significant enhancement"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Scores */}
      <Card>
        <CardHeader>
          <CardTitle>Section Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span className="font-medium">Summary</span>
                </div>
                <Badge className={getScoreBgColor(analysis.sections.summary.score)}>
                  {analysis.sections.summary.score}%
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{analysis.sections.summary.feedback}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  <span className="font-medium">Experience</span>
                </div>
                <Badge className={getScoreBgColor(analysis.sections.experience.score)}>
                  {analysis.sections.experience.score}%
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{analysis.sections.experience.feedback}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  <span className="font-medium">Skills</span>
                </div>
                <Badge className={getScoreBgColor(analysis.sections.skills.score)}>
                  {analysis.sections.skills.score}%
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{analysis.sections.skills.feedback}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  <span className="font-medium">Education</span>
                </div>
                <Badge className={getScoreBgColor(analysis.sections.education.score)}>
                  {analysis.sections.education.score}%
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{analysis.sections.education.feedback}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Strengths */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Weaknesses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{weakness}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Lightbulb className="w-5 h-5" />
              AI Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{suggestion}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Missing Keywords */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Target className="w-5 h-5" />
              Missing Keywords
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analysis.missingKeywords.map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-orange-600 border-orange-300">
                  {keyword}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Consider incorporating these keywords from the job description into your resume.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}