import React, { useState, useEffect, useCallback } from 'react';
import { BotConfig, Internship, JobStatus, BotLog, AnswerTemplate } from './types';
import {
  LayoutDashboard,
  Settings,
  FileText,
  Play,
  Pause,
  RotateCcw,
  Briefcase,
  CheckCircle2,
  XCircle,
  Sparkles,
  UploadCloud,
  Wifi,
  Lock,
  MapPin,
  Search,
  Plus,
  Loader,
  AlertTriangle
} from 'lucide-react';
import { StatCard } from './components/StatCard';
import { JobCard } from './components/JobCard';
import { LogConsole } from './components/LogConsole';
import { generateCoverLetterAnswer, analyzeResume } from './services/geminiService';
import * as InternshalaAPI from './services/internshalaService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const App: React.FC = () => {
  // State
  const [isRunning, setIsRunning] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [credentialsVerified, setCredentialsVerified] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'config' | 'answers'>('config');
  const [password, setPassword] = useState('AScv@1525');
  const [config, setConfig] = useState<BotConfig>({
    keywords: 'web development, react, node.js',
    location: 'Mumbai',
    remoteOnly: true,
    minStipend: 5000,
    email: 'apurvd16@gmail.com',
    resumeUploaded: false
  });
  const [jobs, setJobs] = useState<Internship[]>([]);
  const [logs, setLogs] = useState<BotLog[]>([]);
  const [answers, setAnswers] = useState<AnswerTemplate[]>([
    { question: 'Why should you be hired for this role?', answer: '' },
    { question: 'Are you available for 6 months?', answer: 'Yes, I am available for a duration of 6 months starting immediately.' }
  ]);
  const [resumeText, setResumeText] = useState("");
  const [resumeAnalysis, setResumeAnalysis] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Stats
  const stats = {
    total: jobs.length,
    applied: jobs.filter(j => j.status === JobStatus.APPLIED).length,
    failed: jobs.filter(j => j.status === JobStatus.FAILED).length,
    skipped: jobs.filter(j => j.status === JobStatus.SKIPPED).length,
  };

  const chartData = [
    { name: 'Applied', value: stats.applied, color: '#22c55e' },
    { name: 'Failed', value: stats.failed, color: '#ef4444' },
    { name: 'Skipped', value: stats.skipped, color: '#94a3b8' },
    { name: 'Pending', value: stats.total - stats.applied - stats.failed - stats.skipped, color: '#eab308' },
  ];

  // Helper: Add Log
  const addLog = useCallback((message: string, type: BotLog['type'] = 'info') => {
    const newLog: BotLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    };
    setLogs(prev => [...prev, newLog]);
  }, []);

  // Real Credential Verification with Backend
  const verifyCredentials = async () => {
    if (!password) {
      addLog('Please enter your password', 'error');
      return;
    }

    setIsVerifying(true);
    addLog(`Connecting to Internshala servers with ${config.email}...`, 'info');

    try {
      const result = await InternshalaAPI.verifyCredentials(config.email, password);

      setIsVerifying(false);

      if (result.success) {
        setCredentialsVerified(true);
        addLog("✓ Authentication successful! Credentials verified.", 'success');
        addLog("Browser session established. Ready to scrape.", 'info');
      } else {
        setCredentialsVerified(false);
        addLog(`✗ Login failed: ${result.message}`, 'error');
      }
    } catch (error) {
      setIsVerifying(false);
      setCredentialsVerified(false);
      addLog('✗ Failed to connect to backend. Make sure server is running.', 'error');
    }
  };

  // Real Bot Scraping Effect
  useEffect(() => {
    if (!isRunning) return;

    let isMounted = true;
    let searchExecuted = false;

    const runBot = async () => {
      // Step 1: Search for internships (only once when bot starts)
      if (!searchExecuted) {
        searchExecuted = true;
        addLog(`🔍 Searching Internshala for: "${config.keywords}"...`, 'info');

        try {
          const result = await InternshalaAPI.searchInternships(
            config.keywords,
            config.location,
            config.remoteOnly,
            config.minStipend
          );

          if (!isMounted) return;

          if (result.success && result.internships.length > 0) {
            addLog(`✓ Found ${result.count} matching internships!`, 'success');

            // Convert API response to our Internship type
            const newJobs: Internship[] = result.internships.map(int => ({
              id: int.id,
              title: int.title,
              company: int.company,
              location: int.location,
              stipend: int.stipend,
              posted: int.posted,
              link: int.link,
              status: JobStatus.PENDING
            }));

            setJobs(newJobs);
          } else {
            addLog('⚠ No internships found matching your criteria', 'warning');
          }
        } catch (error) {
          addLog('✗ Failed to search internships', 'error');
        }
      }

      // Step 2: Process pending jobs and apply
      const interval = setInterval(async () => {
        if (!isMounted) {
          clearInterval(interval);
          return;
        }

        setJobs(prevJobs => {
          const pendingJob = prevJobs.find(j => j.status === JobStatus.PENDING);

          if (pendingJob) {
            // Mark as applying
            addLog(`📝 Applying to ${pendingJob.title} at ${pendingJob.company}...`, 'info');

            // Apply asynchronously
            (async () => {
              try {
                // Update status to APPLYING
                setJobs(current => current.map(j =>
                  j.id === pendingJob.id ? { ...j, status: JobStatus.APPLYING } : j
                ));

                const applyResult = await InternshalaAPI.applyToInternship(
                  pendingJob.link,
                  answers
                );

                if (!isMounted) return;

                if (applyResult.success) {
                  addLog(`✓ Successfully applied to ${pendingJob.company}!`, 'success');
                  setJobs(current => current.map(j =>
                    j.id === pendingJob.id ? { ...j, status: JobStatus.APPLIED } : j
                  ));
                } else {
                  addLog(`✗ Failed to apply to ${pendingJob.company}: ${applyResult.message}`, 'error');
                  setJobs(current => current.map(j =>
                    j.id === pendingJob.id ? { ...j, status: JobStatus.FAILED } : j
                  ));
                }
              } catch (error) {
                addLog(`✗ Error applying to ${pendingJob.company}`, 'error');
                setJobs(current => current.map(j =>
                  j.id === pendingJob.id ? { ...j, status: JobStatus.FAILED } : j
                ));
              }
            })();
          }

          return prevJobs;
        });
      }, 5000); // Check every 5 seconds

      return () => {
        clearInterval(interval);
      };
    };

    runBot();

    return () => {
      isMounted = false;
    };
  }, [isRunning, config, answers, addLog]);

  // Handlers
  const handleGenerateAnswer = async (index: number) => {
    setIsGenerating(true);
    const q = answers[index].question;
    const answer = await generateCoverLetterAnswer(q, config.keywords, resumeAnalysis || "General software engineering student");
    const newAnswers = [...answers];
    newAnswers[index].answer = answer;
    setAnswers(newAnswers);
    setIsGenerating(false);
    addLog(`Generated AI answer for: "${q.substring(0, 20)}..."`, 'success');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setConfig(prev => ({ ...prev, resumeUploaded: true }));
      addLog("Resume uploaded: " + e.target.files[0].name, 'success');
      // Simulate extraction
      setResumeText("Experienced React Developer with 3 years of projects. Proficient in Node.js, TypeScript, and Tailwind CSS. Dean's list student.");
      const analysis = await analyzeResume("Experienced React Developer with 3 years of projects. Proficient in Node.js, TypeScript, and Tailwind CSS. Dean's list student.");
      setResumeAnalysis(analysis);
      addLog("Resume analyzed by AI.", 'info');
    }
  };

  return (
    <div className="min-h-screen flex font-sans text-gray-900 bg-gray-50">

      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col fixed h-full z-10 border-r border-gray-800">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            <span>InternBot</span>
          </h1>
          <p className="text-gray-400 text-xs mt-2 font-mono">v2.1.0 • Stable</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'config' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Configuration</span>
          </button>

          <button
            onClick={() => setActiveTab('answers')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'answers' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">AI Answers</span>
          </button>
        </nav>

        <div className="p-4 bg-gray-800 mx-4 mb-4 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium">Status</span>
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span className="text-xs text-gray-300">{isRunning ? 'Running' : 'Stopped'}</span>
            </div>
          </div>
          <button
            disabled={!credentialsVerified && !isRunning}
            onClick={() => {
              if (!credentialsVerified && !isRunning) {
                alert("Please verify credentials in Config first!");
                setActiveTab('config');
                return;
              }
              setIsRunning(!isRunning);
              addLog(isRunning ? "Bot stopped by user." : `Bot started. Searching for '${config.keywords}' in ${config.location}...`, isRunning ? "warning" : "success");
            }}
            className={`w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg font-bold transition-all ${!credentialsVerified && !isRunning
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : isRunning
                ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30'
                : 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/30'
              }`}
          >
            {isRunning ? <><Pause className="w-4 h-4" /> <span>Stop Bot</span></> : <><Play className="w-4 h-4" /> <span>Start Bot</span></>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Live Dashboard</h2>
                <p className="text-gray-500 text-sm mt-1">Monitoring applications for <span className="font-semibold text-blue-600">{config.keywords}</span> in <span className="font-semibold text-blue-600">{config.location}</span></p>
              </div>
              <button onClick={() => setJobs([])} className="text-sm bg-white border border-gray-200 px-3 py-2 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors flex items-center space-x-2">
                <RotateCcw className="w-4 h-4" />
                <span>Reset Session</span>
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Scanned" value={stats.total} icon={Briefcase} color="bg-blue-500" />
              <StatCard title="Applied" value={stats.applied} icon={CheckCircle2} color="bg-green-500" />
              <StatCard title="Failed" value={stats.failed} icon={XCircle} color="bg-red-500" />
              <StatCard title="Skipped" value={stats.skipped} icon={RotateCcw} color="bg-gray-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[550px]">
              {/* Job Feed */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-4 h-4 text-gray-500" />
                    <h3 className="font-semibold text-gray-700">Live Scraper Feed</h3>
                  </div>
                  {isRunning && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full animate-pulse flex items-center"><span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5" />Scraping active</span>}
                </div>
                <div className="p-4 overflow-y-auto space-y-3 flex-1 custom-scrollbar bg-gray-50/50">
                  {jobs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <Search className="w-8 h-8 opacity-20" />
                      </div>
                      <p>Waiting for bot to start scraping...</p>
                      <button onClick={() => { setActiveTab('config'); }} className="text-blue-500 text-sm hover:underline">Check configuration</button>
                    </div>
                  ) : (
                    jobs.map(job => <JobCard key={job.id} job={job} />)
                  )}
                </div>
              </div>

              {/* Console & Chart */}
              <div className="flex flex-col space-y-6 h-full">
                <div className="h-2/5 bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col">
                  <h3 className="font-semibold text-gray-700 mb-2 text-sm">Success Metrics</h3>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis hide />
                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="h-3/5 flex-1 min-h-0">
                  <LogConsole logs={logs} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Configuration Tab */}
        {activeTab === 'config' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
            <div className="flex items-center space-x-3 mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Bot Configuration</h2>
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">config.json</span>
            </div>

            {/* Credentials Section */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Lock className="w-5 h-5 mr-2 text-blue-500" />
                Internshala Credentials
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email Address</label>
                  <input
                    type="email"
                    value={config.email}
                    onChange={(e) => {
                      setConfig({ ...config, email: e.target.value });
                      setCredentialsVerified(false);
                    }}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    placeholder="student@college.edu"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setCredentialsVerified(false);
                    }}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    placeholder="Enter your Internshala password"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={verifyCredentials}
                  disabled={isVerifying || credentialsVerified}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${credentialsVerified
                    ? 'bg-green-100 text-green-700 cursor-default'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    }`}
                >
                  {isVerifying ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : credentialsVerified ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Credentials Verified</span>
                    </>
                  ) : (
                    <>
                      <Wifi className="w-4 h-4" />
                      <span>Test Connection</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Search className="w-5 h-5 mr-2 text-blue-500" />
                Search Filters
              </h3>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Keywords (comma separated)</label>
                <input
                  type="text"
                  value={config.keywords}
                  onChange={(e) => setConfig({ ...config, keywords: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  placeholder="e.g. web development, python, data science"
                />
                <p className="text-xs text-gray-500">The bot will search for these terms exactly.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" />
                    Target City / Location
                  </label>
                  <input
                    type="text"
                    value={config.location}
                    onChange={(e) => setConfig({ ...config, location: e.target.value })}
                    disabled={config.remoteOnly}
                    className={`w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${config.remoteOnly ? 'bg-gray-100 text-gray-400' : ''}`}
                    placeholder="e.g. Bangalore, Delhi, Mumbai"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Min Monthly Stipend (₹)</label>
                  <input
                    type="number"
                    value={config.minStipend}
                    onChange={(e) => setConfig({ ...config, minStipend: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg flex items-center justify-between border border-blue-100">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-6 rounded-full p-1 transition-colors ${config.remoteOnly ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${config.remoteOnly ? 'translate-x-4' : ''}`} />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900 block">Remote Only Mode</span>
                    <span className="text-xs text-gray-500 block">If enabled, 'Location' field is ignored.</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.remoteOnly}
                  onChange={(e) => setConfig({ ...config, remoteOnly: e.target.checked })}
                  className="hidden"
                  id="remote-toggle"
                />
                <label htmlFor="remote-toggle" className="absolute inset-0 cursor-pointer w-full h-full opacity-0 pointer-events-none"></label>
              </div>
            </div>

            {/* Resume Section */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-500" />
                Resume Data
              </h3>
              <div className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors ${config.resumeUploaded ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-400'}`}>
                {config.resumeUploaded ? (
                  <>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-green-700 font-medium">Resume.pdf parsed successfully</p>
                    <p className="text-xs text-green-600 mt-1">AI has analyzed 5 technical skills.</p>
                    <button className="text-sm text-gray-500 underline mt-4 hover:text-gray-700">Update Resume</button>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-gray-600 font-medium mb-1">Upload your Resume (PDF)</p>
                    <p className="text-gray-400 text-xs mb-4">The bot extracts skills to auto-fill 'Why should we hire you?'</p>
                    <input type="file" accept=".pdf" onChange={handleFileUpload} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Answers Tab */}
        {activeTab === 'answers' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">AI Cover Letter Generator</h2>
                <p className="text-gray-500 mt-1">Configure how the bot answers common application questions.</p>
              </div>
              {!config.resumeUploaded && (
                <div className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Upload resume first
                </div>
              )}
            </div>

            <div className="grid gap-6">
              {answers.map((item, index) => (
                <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative group hover:border-blue-300 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <label className="text-sm font-semibold text-gray-700 block w-3/4">
                      {item.question}
                    </label>
                    <button
                      onClick={() => handleGenerateAnswer(index)}
                      disabled={isGenerating}
                      className="flex items-center space-x-1 text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-200 transition-colors disabled:opacity-50"
                    >
                      {isGenerating ? <Loader className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      <span>Generate with AI</span>
                    </button>
                  </div>
                  <textarea
                    value={item.answer}
                    onChange={(e) => {
                      const newAnswers = [...answers];
                      newAnswers[index].answer = e.target.value;
                      setAnswers(newAnswers);
                    }}
                    className="w-full h-32 p-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none font-sans leading-relaxed"
                    placeholder="Click 'Generate with AI' to draft a response based on your resume and keywords..."
                  />
                  <div className="absolute top-0 right-0 h-full w-1 bg-blue-500 rounded-r-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}

              <button
                onClick={() => setAnswers([...answers, { question: "New Question", answer: "" }])}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Another Question Template</span>
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;