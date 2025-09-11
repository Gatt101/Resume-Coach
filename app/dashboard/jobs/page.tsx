"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Briefcase, Search, MapPin, Building, ArrowLeft, AlertCircle, Zap, Filter, Bookmark, ExternalLink } from "lucide-react";

interface Job {
  job_id: string;
  title: string;
  company_name: string;
  location: string;
  description: string;
  via: string;
  extensions: string[];
  apply_options?: { title: string; link: string }[];
}

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState("software engineer");
  const [location, setLocation] = useState("Austin, TX");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [fulltimeOnly, setFulltimeOnly] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchJobs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Call our server-side proxy which reads the SERP_API_KEY from the server env.
      const params = new URLSearchParams({
        engine: "google_jobs",
        q: searchQuery || "software engineer",
        location: location,
        hl: "en",
        gl: "us",
      });
      const response = await fetch(`/api/jobs?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Fetch failed with status ${response.status}`);
      }
      const data = await response.json();
      setJobs(data.jobs_results || []);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch job listings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Called when the user explicitly presses the Search button.
  const handleSearch = async () => {
    // Switch to results immediately to show loading state there.
  setSearched(true);
  setPage(1);
  await fetchJobs();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-indigo-900 p-6 text-white">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/dashboard")}
          className="hover:bg-white/10 border-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Discover Jobs</h1>
            <p className="text-slate-200">Find roles and opportunities that match your skills — redesigned view</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-800/50 border border-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-300" />
          <p className="text-red-200">{error}</p>
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left panel: search + filters */}
        <aside className="lg:col-span-4 bg-white/6 rounded-lg p-4 space-y-4">
          <div>
            <label className="text-sm text-slate-200 block mb-2">Role</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
              <Input
                placeholder="e.g. Software Engineer"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-transparent text-white border-white/20"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-200 block mb-2">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
              <Input
                placeholder="City, state or remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10 bg-transparent text-white border-white/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setRemoteOnly((v) => !v)}
              className={`px-3 py-2 rounded-md text-sm ${remoteOnly ? 'bg-indigo-600' : 'bg-white/6'}`}
            >
              Remote
            </button>
            <button
              onClick={() => setFulltimeOnly((v) => !v)}
              className={`px-3 py-2 rounded-md text-sm ${fulltimeOnly ? 'bg-indigo-600' : 'bg-white/6'}`}
            >
              Full-time
            </button>
            <Button onClick={handleSearch} className="ml-auto bg-indigo-500 hover:bg-indigo-600">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
            </Button>
          </div>

          <Card className="bg-white/4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Zap className="w-4 h-4"/> Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-200 space-y-2">
                <li>Try multiple combinations of title + location for broader results.</li>
                <li>Toggle Remote to see distributed roles.</li>
              </ul>
            </CardContent>
          </Card>
        </aside>

        {/* Right panel: results */}
        <main className="lg:col-span-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Results</h2>
              <p className="text-sm text-slate-300">{searched ? `${jobs.length} jobs for "${searchQuery}"` : 'Search to load results'}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span className="hidden sm:inline">Sort:</span>
              <select className="bg-white/6 text-white rounded px-2 py-1" defaultValue="relevance">
                <option value="relevance">Relevance</option>
                <option value="recent">Most recent</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-10 h-10 animate-spin text-white" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12 text-slate-300">
                <Briefcase className="w-12 h-12 mx-auto mb-4" />
                <p>No results yet — try a different search.</p>
              </div>
            ) : (
              jobs.slice((page - 1) * pageSize, page * pageSize).map((job) => (
                <Card key={job.job_id} className="flex items-start gap-4 p-4 bg-white/6">
                  <div className="w-16 h-16 bg-white/8 rounded-md flex items-center justify-center text-slate-200">
                    <span className="text-sm">Logo</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{job.title}</h3>
                        <div className="text-sm text-slate-300 flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1"><Building className="w-4 h-4"/>{job.company_name}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-4 h-4"/>{job.location}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={() => window.open(job.apply_options?.[0]?.link || '#', '_blank')}>
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" onClick={() => console.log('save', job.job_id)}>
                          <Bookmark className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 mt-3 line-clamp-3">{job.description.replace(/<[^>]+>/g, '')}</p>
                    <div className="flex items-center gap-2 mt-3">
                      {(job.extensions || []).map((ext, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 rounded bg-indigo-600 text-white">{ext}</span>
                      ))}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* simple pagination */}
          {jobs.length > pageSize && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button variant="ghost" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
              <div className="px-3 py-1 bg-white/6 rounded">Page {page} of {Math.ceil(jobs.length / pageSize)}</div>
              <Button variant="ghost" disabled={page === Math.ceil(jobs.length / pageSize)} onClick={() => setPage((p) => Math.min(Math.ceil(jobs.length / pageSize), p + 1))}>Next</Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
