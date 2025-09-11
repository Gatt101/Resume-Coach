import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2 } from "lucide-react"

interface TemplatePreviewProps {
  template: string
  isSelected: boolean
  onClick: () => void
}

const sampleData = {
  modern: {
    title: "Modern",
    description: "Clean, contemporary design with gradient header",
    preview: (
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 h-12 p-2">
          <div className="text-white text-xs font-bold">John Doe</div>
          <div className="text-blue-100 text-xs">Software Engineer</div>
        </div>
        <div className="p-3 space-y-2">
          <div className="h-2 bg-blue-200 rounded w-3/4"></div>
          <div className="h-2 bg-gray-200 rounded w-full"></div>
          <div className="h-2 bg-gray-200 rounded w-2/3"></div>
          <div className="flex gap-1 mt-2">
            <Badge className="text-xs bg-blue-100 text-blue-800">React</Badge>
            <Badge className="text-xs bg-blue-100 text-blue-800">Node.js</Badge>
          </div>
        </div>
      </div>
    )
  },
  classic: {
    title: "Classic",
    description: "Traditional, formal layout with serif typography",
    preview: (
      <div className="bg-gray-50 border rounded-lg overflow-hidden font-serif">
        <div className="p-3 border-b-2 border-black">
          <div className="text-center">
            <div className="font-bold text-sm">John Doe</div>
            <div className="text-xs">john@email.com • (555) 123-4567</div>
          </div>
        </div>
        <div className="p-3 space-y-2">
          <div className="text-xs font-bold uppercase border-b border-gray-400">Experience</div>
          <div className="h-2 bg-gray-300 rounded w-3/4"></div>
          <div className="h-2 bg-gray-200 rounded w-full"></div>
          <div className="h-2 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  },
  creative: {
    title: "Creative",
    description: "Colorful, innovative design with sidebar layout",
    preview: (
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border rounded-lg overflow-hidden font-mono">
        <div className="flex h-32">
          <div className="w-1/3 bg-gradient-to-b from-purple-600 to-blue-600 p-2">
            <div className="w-6 h-6 bg-white rounded-full mx-auto mb-1"></div>
            <div className="text-white text-xs text-center font-bold">JD</div>
            <div className="space-y-1 mt-2">
              <div className="h-1 bg-purple-300 rounded w-full"></div>
              <div className="h-1 bg-purple-300 rounded w-3/4"></div>
            </div>
          </div>
          <div className="flex-1 p-2 space-y-1">
            <div className="h-2 bg-purple-200 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded w-full"></div>
            <div className="h-2 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  },
  professional: {
    title: "Professional",
    description: "Corporate-style layout with blue accents",
    preview: (
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="border-t-4 border-blue-600">
          <div className="p-3">
            <div className="font-bold text-blue-800 text-sm">John Doe</div>
            <div className="text-xs text-gray-600">john@email.com | (555) 123-4567</div>
          </div>
        </div>
        <div className="p-3 space-y-2">
          <div className="text-xs font-bold text-blue-800 border-b border-blue-200">EXPERIENCE</div>
          <div className="bg-blue-50 p-2 rounded border-l-2 border-blue-400">
            <div className="h-1 bg-blue-300 rounded w-3/4 mb-1"></div>
            <div className="h-1 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    )
  }
}

export function TemplatePreview({ template, isSelected, onClick }: TemplatePreviewProps) {
  const templateData = sampleData[template as keyof typeof sampleData]

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected 
          ? 'ring-2 ring-blue-500 border-blue-500 shadow-md' 
          : 'hover:border-gray-400'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg">{templateData.title}</h3>
            <p className="text-sm text-gray-600">{templateData.description}</p>
          </div>
          {isSelected && (
            <CheckCircle2 className="w-5 h-5 text-blue-500 mt-1" />
          )}
        </div>
        
        <div className="border rounded-lg p-2 bg-gray-50">
          <div className="transform scale-75 origin-top-left w-full">
            {templateData.preview}
          </div>
        </div>
        
        <div className="mt-3 flex justify-center">
          <Badge 
            variant={isSelected ? "default" : "outline"}
            className={isSelected ? "bg-blue-500" : ""}
          >
            {isSelected ? "Selected" : "Preview"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
