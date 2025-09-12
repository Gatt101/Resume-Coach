import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { BuilderBot, helloWorld, generateResumeFunction, AiCareerAgent, analyzeResumeGapsFunction, enhancedGapAnalysisFunction } from "@/inngest/function";

// Create an API that serves all Inngest functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    helloWorld,
    BuilderBot,
    generateResumeFunction,
    AiCareerAgent,
    analyzeResumeGapsFunction,
    enhancedGapAnalysisFunction
  ],
});