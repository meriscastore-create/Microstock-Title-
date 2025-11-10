
import React, { useState, useCallback, useMemo } from 'react';
import type { JsonPrompt } from './types';
import { generateTitle, generateJson, modifyJson, isApiKeySet } from './services/geminiService';
import { CopyIcon, CheckIcon, WandIcon, PaletteIcon } from './components/Icons';

const ApiKeyError: React.FC = () => (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-slate-800 border border-red-500/50 rounded-xl p-8 text-center shadow-lg animate-fade-in">
            <h1 className="text-3xl font-bold text-red-400 mb-4">Configuration Error</h1>
            <p className="text-slate-300 text-lg mb-2">
                The Gemini API key is missing or invalid.
            </p>
            <p className="text-slate-400">
                To fix this for deployment, go to your hosting provider's dashboard (e.g., Vercel) and add an Environment Variable.
            </p>
            <div className="mt-6 bg-slate-900 text-left p-4 rounded-lg text-slate-300 font-mono text-sm space-y-1">
               {/* CORRECT: Instruct the user to use the VITE_ prefix */}
               <p><span className="text-cyan-400">Variable Name:</span> VITE_API_KEY</p>
               <p><span className="text-cyan-400">Variable Value:</span> Your-Secret-Gemini-API-Key</p>
            </div>
             <p className="text-slate-500 mt-4 text-xs">
                The 'VITE_' prefix is required by the build system for security.
            </p>
        </div>
    </div>
);


const App: React.FC = () => {
    const [inputValue, setInputValue] = useState<string>('');
    const [generatedTitle, setGeneratedTitle] = useState<string>('');
    const [jsonPrompt, setJsonPrompt] = useState<JsonPrompt | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [iframeSrc, setIframeSrc] = useState<string>('https://www.mykeyworder.com/');
    const [copiedTitle, setCopiedTitle] = useState<boolean>(false);
    const [copiedJson, setCopiedJson] = useState<boolean>(false);
    const [isIframeVisible, setIsIframeVisible] = useState<boolean>(false);

    if (!isApiKeySet) {
        return <ApiKeyError />;
    }

    const handleGenerate = useCallback(async () => {
        if (!inputValue.trim()) {
            setError('Please enter a main element.');
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedTitle('');
        setJsonPrompt(null);
        setIsIframeVisible(false);
        setIframeSrc('https://www.mykeyworder.com/');

        try {
            const title = await generateTitle(inputValue);
            setGeneratedTitle(title);

            const json = await generateJson(title);
            setJsonPrompt(json);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to generate content. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [inputValue]);

    const handleModifyJson = useCallback(async (modificationType: 'color' | 'style') => {
        if (!jsonPrompt) return;

        setIsLoading(true);
        setError('');

        try {
            const modifiedJson = await modifyJson(jsonPrompt, modificationType);
            setJsonPrompt(modifiedJson);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to modify the prompt. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [jsonPrompt]);

    const handleCopy = (text: string, type: 'title' | 'json') => {
        navigator.clipboard.writeText(text);
        if (type === 'title') {
            setCopiedTitle(true);
            setTimeout(() => setCopiedTitle(false), 2000);
        } else {
            setCopiedJson(true);
            setTimeout(() => setCopiedJson(false), 2000);
        }
    };
    
    const handleCheckKeywords = () => {
        if (generatedTitle) {
            const encodedTitle = encodeURIComponent(generatedTitle);
            setIframeSrc(`https://www.mykeyworder.com/keywords?language=en&tags=${encodedTitle}`);
            setIsIframeVisible(true);
        }
    };

    const jsonString = useMemo(() => {
        return jsonPrompt ? JSON.stringify(jsonPrompt, null, 2) : '';
    }, [jsonPrompt]);

    const charCount = jsonString.length;

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                        Microstock Title & Prompt Generator
                    </h1>
                    <p className="mt-2 text-slate-400 max-w-2xl mx-auto">
                        Enter a theme to generate a keyword-rich title and a customizable AI art prompt for your seamless patterns.
                    </p>
                </header>

                <main className={`grid grid-cols-1 ${isIframeVisible ? 'lg:grid-cols-2' : ''} gap-8 transition-all duration-500`}>
                    {/* Left Column */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
                            <h2 className="text-xl font-semibold mb-4 text-cyan-400">1. Enter Main Element</h2>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="e.g., Christmas Tree, Spooky Cat"
                                    className="flex-grow bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                                />
                                <button
                                    onClick={handleGenerate}
                                    disabled={isLoading}
                                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg transition duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {isLoading && !generatedTitle ? (
                                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                    ) : 'Generate'}
                                </button>
                            </div>
                            {error && <p className="text-red-400 mt-2">{error}</p>}
                        </div>

                        {isLoading && !generatedTitle && (
                            <div className="text-center p-8 bg-slate-800 rounded-xl border border-slate-700">
                                <p className="text-lg">Generating creative content... please wait.</p>
                            </div>
                        )}

                        {generatedTitle && (
                            <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 animate-fade-in">
                                <h2 className="text-xl font-semibold mb-4 text-cyan-400">2. Generated Title</h2>
                                <div className="bg-slate-700/50 p-4 rounded-lg mb-4">
                                    <p className="text-slate-300">{generatedTitle}</p>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => handleCopy(generatedTitle, 'title')} className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white font-medium py-2 px-4 rounded-lg transition">
                                        <CopyIcon /> {copiedTitle ? 'Copied!' : 'Copy'}
                                    </button>
                                    <button onClick={handleCheckKeywords} className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white font-medium py-2 px-4 rounded-lg transition">
                                        <CheckIcon /> Checker
                                    </button>
                                </div>
                            </div>
                        )}

                        {jsonPrompt && (
                             <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 animate-fade-in">
                                <div className="flex justify-between items-center mb-4">
                                     <h2 className="text-xl font-semibold text-cyan-400">3. JSON Prompt</h2>
                                     <span className={`font-mono text-sm ${charCount > 910 ? 'text-red-400' : 'text-slate-400'}`}>{charCount} / 910</span>
                                </div>
                                <div className="relative bg-slate-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                                    <button onClick={() => handleCopy(jsonString, 'json')} className="absolute top-2 right-2 p-2 bg-slate-700 hover:bg-slate-600 rounded-md transition">
                                        {copiedJson ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                                    </button>
                                    <pre><code>{jsonString}</code></pre>
                                </div>
                                 <div className="mt-4 flex flex-col sm:flex-row gap-4">
                                     <button onClick={() => handleModifyJson('color')} disabled={isLoading} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded-lg transition disabled:bg-slate-600">
                                         <PaletteIcon /> Change Color
                                     </button>
                                     <button onClick={() => handleModifyJson('style')} disabled={isLoading} className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-medium py-2 px-4 rounded-lg transition disabled:bg-slate-600">
                                         <WandIcon /> Change Style
                                     </button>
                                 </div>
                                 {isLoading && generatedTitle && (
                                     <div className="text-center p-4">
                                         <p className="text-slate-400">Modifying prompt...</p>
                                     </div>
                                 )}
                             </div>
                        )}
                    </div>
                    
                    {/* Right Column */}
                    {isIframeVisible && (
                        <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 min-h-[600px] lg:min-h-0 animate-fade-in">
                             <iframe 
                                 src={iframeSrc}
                                 title="MyKeyworder Keyword Checker"
                                 className="w-full h-full rounded-xl border-0"
                             ></iframe>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default App;
