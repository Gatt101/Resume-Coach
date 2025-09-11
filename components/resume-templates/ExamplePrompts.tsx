import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb } from "lucide-react"

interface ExamplePromptsProps {
  onSelectPrompt: (prompt: string) => void
}

const examplePrompts = [
  {
    title: "Software Engineer",
    description: "5+ years experience in web development",
    prompt: "Experienced Software Engineer with 5+ years of experience in full-stack web development. Proficient in React, Node.js, Python, and cloud technologies like AWS. Led development teams and delivered scalable applications serving millions of users. Strong background in agile methodologies and DevOps practices. Looking for a Senior Software Engineer role at an innovative tech company where I can contribute to cutting-edge projects and mentor junior developers.",
    tags: ["Tech", "Leadership", "Full-Stack"]
  },
  {
    title: "Marketing Professional",
    description: "Digital marketing specialist with analytics focus",
    prompt: "Results-driven Digital Marketing Professional with 4 years of experience in campaign management, SEO/SEM, and data analytics. Successfully increased organic traffic by 300% and conversion rates by 45% across multiple campaigns. Expert in Google Analytics, social media marketing, and content strategy. Certified in Google Ads and Facebook Marketing. Seeking a Marketing Manager position where I can leverage data-driven insights to drive business growth and brand awareness.",
    tags: ["Marketing", "Analytics", "Growth"]
  },
  {
    title: "Data Scientist",
    description: "Machine learning and business intelligence expert",
    prompt: "Data Scientist with 3+ years of experience in machine learning, statistical analysis, and business intelligence. Proficient in Python, R, SQL, and visualization tools like Tableau and Power BI. Built predictive models that improved business decision-making and increased revenue by 20%. PhD in Statistics with published research in data mining. Looking for a Senior Data Scientist role where I can solve complex business problems using advanced analytics and AI.",
    tags: ["Data Science", "ML", "Analytics"]
  },
  {
    title: "Product Manager",
    description: "Strategic product development and user experience",
    prompt: "Strategic Product Manager with 6 years of experience in product development, user research, and cross-functional team leadership. Successfully launched 15+ products that generated $50M+ in revenue. Expert in agile methodologies, user story mapping, and data-driven product decisions. Strong background in UX design and customer development. MBA in Business Strategy. Seeking a Senior Product Manager role where I can drive innovation and create user-centric products that solve real-world problems.",
    tags: ["Product", "Strategy", "Leadership"]
  }
]

export function ExamplePrompts({ onSelectPrompt }: ExamplePromptsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Lightbulb className="w-4 h-4" />
        <span>Need inspiration? Try one of these examples:</span>
      </div>
      
      <div className="grid gap-3">
        {examplePrompts.map((example, index) => (
          <Card 
            key={index}
            className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-blue-200 hover:border-blue-400"
            onClick={() => onSelectPrompt(example.prompt)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900">{example.title}</h4>
                  <p className="text-sm text-gray-600">{example.description}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {example.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2">
                {example.prompt.substring(0, 120)}...
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
