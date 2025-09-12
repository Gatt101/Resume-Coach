"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Star,
  Briefcase,
  Users,
  MapPin,
  DollarSign,
  Lightbulb,
  Eye,
  EyeOff
} from "lucide-react";
import type { JobAnalysis, WeightedKeyword, Skill, CompatibilityScore } from "@/lib/services/job-analysis-service";

interface JobAnalysisDisplayProps {
  analysis: JobAnalysis;
  compatibilityScore?: CompatibilityScore;
  onKeywordClick?: (keyword: WeightedKeyword) => void;
  onSkillClick?: (skill: Skill) => void;
}

export function JobAnalysisDisplay({
  analysis,
  compatibilityScore,
  onKeywordClick,
  onSkillClick
}: JobAnalysisDisplayProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showAllKeywords, setShowAllKeywords] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'required': return 'bg-red-100 text-red-800 border-red-200';
      case 'preferred': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'nice-to-have': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical': return 'bg-purple-100 text-purple-800';
      case 'soft': return 'bg-blue-100 text-blue-800';
      case 'industry': return 'bg-green-100 text-green-800';
      case 'role': return 'bg-orange-100 text-orange-800';
      case 'company': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getExperienceLevelIcon = (level: string) => {
    switch (level) {
      case 'entry': return '🌱';
      case 'junior': return '🌿';
      case 'mid': return '🌳';
      case 'senior': return '🏆';
      case 'lead': return '👑';
      case 'executive': return '💎';
      default: return '📊';
    }
  };

  const filteredKeywords = selectedCategory 
    ? analysis.keywords.filter(k => k.category === selectedCategory)
    : analysis.keywords;

  const displayedKeywords = showAllKeywords 
    ? filteredKeywords 
    : filteredKeywords.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header with Key Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Job Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {analysis.keywords.length}
              </div>
              <div className="text-sm text-gray-600">Key Terms</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {analysis.requiredSkills.length}
              </div>
              <div className="text-sm text-gray-600">Required Skills</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {analysis.preferredSkills.length}
              </div>
              <div className="text-sm text-gray-600">Preferred Skills</div>
            </div>
            <div className="text-center">
              <div className="text-2xl">
                {getExperienceLevelIcon(analysis.experienceLevel)}
              </div>
              <div className="text-sm text-gray-600 capitalize">
                {analysis.experienceLevel} Level
              </div>
            </div>
          </div>

          {/* Compatibility Score */}
          {compatibilityScore && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Resume Compatibility</h4>
                <span className="text-2xl font-bold text-blue-600">
                  {compatibilityScore.overall}%
                </span>
              </div>
              <Progress value={compatibilityScore.overall} className="mb-3" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Skills:</span>
                  <span className="ml-1 font-medium">{compatibilityScore.breakdown.skills}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Keywords:</span>
                  <span className="ml-1 font-medium">{compatibilityScore.breakdown.keywords}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Experience:</span>
                  <span className="ml-1 font-medium">{compatibilityScore.breakdown.experience}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Qualifications:</span>
                  <span className="ml-1 font-medium">{compatibilityScore.breakdown.qualifications}%</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Company & Role Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Role Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Company Size:</span>
                  <Badge variant="outline" className="capitalize">
                    {analysis.companySize}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Role Type:</span>
                  <Badge variant="outline" className="capitalize">
                    {analysis.roleType.replace('-', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Work Style:</span>
                  <Badge variant="outline" className="capitalize">
                    {analysis.workArrangement}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Industry:</span>
                  <Badge variant="outline" className="capitalize">
                    {analysis.industryContext}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Top Keywords Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.keywords.slice(0, 5).map((keyword, index) => (
                    <div key={keyword.keyword} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{keyword.keyword}</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getCategoryColor(keyword.category)}`}
                        >
                          {keyword.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={keyword.weight * 100} className="w-16 h-2" />
                        <span className="text-xs text-gray-500 w-8">
                          {Math.round(keyword.weight * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Benefits */}
          {analysis.benefits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Benefits & Perks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.benefits.map((benefit, index) => (
                    <Badge key={index} variant="secondary">
                      {benefit}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Keyword Analysis</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllKeywords(!showAllKeywords)}
                  >
                    {showAllKeywords ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    {showAllKeywords ? 'Show Less' : 'Show All'}
                  </Button>
                </div>
              </div>
              
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  All Categories
                </Button>
                {['technical', 'soft', 'industry', 'role', 'company'].map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="capitalize"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {displayedKeywords.map((keyword) => (
                  <div
                    key={keyword.keyword}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onKeywordClick?.(keyword)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{keyword.keyword}</span>
                        <Badge 
                          variant="outline" 
                          className={getCategoryColor(keyword.category)}
                        >
                          {keyword.category}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          ({keyword.frequency}x)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={keyword.weight * 100} className="w-20 h-2" />
                        <span className="text-sm font-medium w-10">
                          {Math.round(keyword.weight * 100)}%
                        </span>
                      </div>
                    </div>
                    
                    {keyword.synonyms.length > 0 && (
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Synonyms:</span> {keyword.synonyms.join(', ')}
                      </div>
                    )}
                    
                    {keyword.context.length > 0 && (
                      <div className="text-xs text-gray-600 mt-1">
                        <span className="font-medium">Context:</span> "{keyword.context[0].substring(0, 100)}..."
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Required Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Required Skills ({analysis.requiredSkills.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.requiredSkills.map((skill, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() => onSkillClick?.(skill)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{skill.name}</span>
                        <Badge 
                          variant="outline" 
                          className={getCategoryColor(skill.category)}
                        >
                          {skill.category}
                        </Badge>
                      </div>
                      <Badge className={getImportanceColor(skill.importance)}>
                        {skill.importance}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Preferred Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Preferred Skills ({analysis.preferredSkills.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.preferredSkills.map((skill, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() => onSkillClick?.(skill)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{skill.name}</span>
                        <Badge 
                          variant="outline" 
                          className={getCategoryColor(skill.category)}
                        >
                          {skill.category}
                        </Badge>
                      </div>
                      <Badge className={getImportanceColor(skill.importance)}>
                        {skill.importance}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Requirements Tab */}
        <TabsContent value="requirements" className="space-y-4">
          <div className="grid gap-4">
            {/* Responsibilities */}
            {analysis.responsibilities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Key Responsibilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.responsibilities.map((responsibility, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span className="text-sm">{responsibility}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Qualifications */}
            {analysis.qualifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Required Qualifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.qualifications.map((qualification, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-600 mt-1">•</span>
                        <span className="text-sm">{qualification}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Nice to Have */}
            {analysis.niceToHave.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Nice to Have</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.niceToHave.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          {/* Red Flags */}
          {analysis.redFlags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Potential Red Flags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.redFlags.map((flag, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded">
                      <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-red-800">{flag}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Matching Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-600" />
                Resume Tailoring Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.matchingTips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded">
                    <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-blue-800">{tip}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Compatibility Insights */}
          {compatibilityScore && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Strengths */}
              {compatibilityScore.strengths.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Your Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {compatibilityScore.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Gaps */}
              {compatibilityScore.gaps.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-orange-600" />
                      Areas to Improve
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {compatibilityScore.gaps.map((gap, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <TrendingUp className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}