
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import QuizModule from './components/QuizModule';
import MapPicker from './components/MapPicker';
import { LocationData, QuizQuestion, ChatMessage, AppScreen } from './types';
import { getPlaceInfo, generateQuiz, chatWithAI, PlaceInfoResponse } from './services/geminiService';

const App: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<AppScreen>(AppScreen.HOME);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [info, setInfo] = useState<PlaceInfoResponse>({ text: '' });
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeepThinking, setIsDeepThinking] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastAttempt, setLastAttempt] = useState<(() => void) | null>(null);

  useEffect(() => {
    const cachedLoc = localStorage.getItem('s_location');
    const cachedInfo = localStorage.getItem('s_info');
    const cachedQuiz = localStorage.getItem('s_quiz');
    
    if (cachedLoc) {
      try {
        const loc = JSON.parse(cachedLoc);
        setLocation(loc);
        if (cachedInfo) setInfo(JSON.parse(cachedInfo));
        if (cachedQuiz) setQuiz(JSON.parse(cachedQuiz));
      } catch (e) {
        detectLocation();
      }
    } else {
      detectLocation();
    }
  }, []);

  const fetchWithRetry = async (url: string, options: RequestInit = {}, retries = 2, backoff = 1000): Promise<Response> => {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Accept-Language': 'en',
          // Note: Browser fetch might not allow setting User-Agent, but adding a custom identifying header sometimes helps with some CDNs.
          'X-Requested-With': 'SmartInfoQueue-App'
        }
      });
      if (!response.ok) {
        if (response.status === 429 && retries > 0) {
          await new Promise(resolve => setTimeout(resolve, backoff));
          return fetchWithRetry(url, options, retries - 1, backoff * 2);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, backoff));
        return fetchWithRetry(url, options, retries - 1, backoff * 2);
      }
      throw error;
    }
  };

  const reverseGeocode = async (lat: number, lon: number) => {
    setIsLoading(true);
    setErrorMessage(null);
    setLastAttempt(() => () => reverseGeocode(lat, lon));
    try {
      const res = await fetchWithRetry(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await res.json();
      
      const newLoc: LocationData = {
        lat,
        lon,
        displayName: data.display_name,
        type: data.type || data.category || 'Public Place',
        name: data.name || data.address.bank || data.address.hospital || data.address.university || data.address.amenity || data.address.office || 'Current Location'
      };
      await updateLocationState(newLoc);
    } catch (e) {
      console.error("Geocoding failed", e);
      setErrorMessage("Could not detect your location details. The service might be temporarily unavailable. Please try again or search manually.");
      setIsLoading(false);
    }
  };

  const detectLocation = () => {
    setIsLoading(true);
    setErrorMessage(null);
    setLastAttempt(() => detectLocation);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.error(err);
          setErrorMessage("Location access denied or unavailable. Please enable GPS or search for your location manually.");
          setIsLoading(false);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      setErrorMessage("Geolocation is not supported by your browser.");
      setIsLoading(false);
    }
  };

  const searchLocation = async (q: string) => {
    if (!q.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);
    setLastAttempt(() => () => searchLocation(q));
    try {
      const res = await fetchWithRetry(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`);
      const data = await res.json();
      
      if (data && data[0]) {
        const item = data[0];
        const newLoc: LocationData = {
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          displayName: item.display_name,
          type: item.type || 'Location',
          name: item.display_name.split(',')[0]
        };
        await updateLocationState(newLoc);
      } else {
        setErrorMessage("No places found for that search query. Try being more specific.");
      }
    } catch (e) {
      console.error("Search failed", e);
      setErrorMessage("Search failed due to a connection issue. Please check your internet and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateLocationState = async (loc: LocationData) => {
    setLocation(loc);
    localStorage.setItem('s_location', JSON.stringify(loc));
    
    setIsLoading(true);
    try {
      const [newInfo, newQuiz] = await Promise.all([
        getPlaceInfo(loc.name || loc.displayName, loc.type || ''),
        generateQuiz(loc.name || loc.displayName, loc.type || '')
      ]);
      setInfo(newInfo);
      setQuiz(newQuiz);
      localStorage.setItem('s_info', JSON.stringify(newInfo));
      localStorage.setItem('s_quiz', JSON.stringify(newQuiz));
    } catch (e) {
      console.error("AI fetch failed", e);
      setErrorMessage("Connected to location, but failed to load AI insights. You can still use the assistant.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    
    const botThinking: ChatMessage = { role: 'model', text: 'Thinking...', isThinking: true };
    setChatHistory(prev => [...prev, botThinking]);

    try {
      const context = location ? `${location.name} (${location.type})` : "Public area";
      const responseText = await chatWithAI(chatInput, context, chatHistory.map(m => ({ role: m.role, text: m.text })), isDeepThinking);
      setChatHistory(prev => {
        const next = [...prev];
        next.pop();
        return [...next, { role: 'model', text: responseText }];
      });
    } catch (e) {
      setChatHistory(prev => {
        const next = [...prev];
        next.pop();
        return [...next, { role: 'model', text: "Sorry, I'm having trouble connecting to my brain right now. Please try again." }];
      });
    }
  };

  const renderHome = () => (
    <div className="p-6 space-y-6">
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top duration-300 shadow-sm">
          <i className="fa-solid fa-circle-exclamation text-rose-500 mt-1"></i>
          <div className="flex-1">
            <p className="text-sm text-rose-700 font-medium leading-snug">{errorMessage}</p>
            <div className="flex gap-4 mt-2">
              {lastAttempt && (
                <button 
                  onClick={() => {
                    setErrorMessage(null);
                    lastAttempt();
                  }} 
                  className="text-[10px] uppercase font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <i className="fa-solid fa-rotate-right"></i> Retry
                </button>
              )}
              <button 
                onClick={() => setErrorMessage(null)} 
                className="text-[10px] uppercase font-bold text-slate-400 hover:text-slate-600"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <i className="fa-solid fa-location-dot text-xl"></i>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Your Location</h2>
            <h3 className="text-xl font-bold text-slate-800 truncate">{location?.name || 'Detecting...'}</h3>
            <p className="text-xs text-indigo-500 font-semibold">{location?.type || 'Searching place type...'}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input 
              type="text"
              placeholder="Search manually..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-900"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchLocation(searchQuery)}
            />
            <button 
              onClick={() => searchLocation(searchQuery)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              <i className="fa-solid fa-magnifying-glass"></i>
            </button>
          </div>
          <button 
            onClick={() => setShowMap(true)}
            className="w-12 h-12 bg-slate-100 rounded-xl text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors"
            title="Pick on map"
          >
            <i className="fa-solid fa-map"></i>
          </button>
        </div>

        <button 
          onClick={detectLocation}
          className="mt-4 flex items-center gap-2 text-indigo-600 text-[10px] font-bold uppercase tracking-wider hover:underline"
        >
          <i className="fa-solid fa-crosshairs"></i>
          Reset to GPS Location
        </button>
      </section>

      <div className="grid grid-cols-1 gap-4">
        <button 
          onClick={() => setActiveScreen(AppScreen.INFO)}
          disabled={!location}
          className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 text-left active:scale-[0.98] transition-all group ${!location ? 'opacity-50 grayscale' : ''}`}
        >
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <i className="fa-solid fa-circle-info text-xl"></i>
          </div>
          <div>
            <h4 className="font-bold text-slate-800">Place Information</h4>
            <p className="text-xs text-slate-400">Learn about purpose, services, and rules.</p>
          </div>
          <i className="fa-solid fa-chevron-right ml-auto text-slate-300"></i>
        </button>

        <button 
          onClick={() => setActiveScreen(AppScreen.QUIZ)}
          disabled={!location || quiz.length === 0}
          className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 text-left active:scale-[0.98] transition-all group ${(!location || quiz.length === 0) ? 'opacity-50 grayscale' : ''}`}
        >
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <i className="fa-solid fa-lightbulb text-xl"></i>
          </div>
          <div>
            <h4 className="font-bold text-slate-800">Educational Quiz</h4>
            <p className="text-xs text-slate-400">Test your knowledge while you wait.</p>
          </div>
          <i className="fa-solid fa-chevron-right ml-auto text-slate-300"></i>
        </button>
      </div>

      <section className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="font-bold text-lg mb-1">AI Assistant</h3>
          <p className="text-slate-400 text-sm mb-6">Have questions? Ask me about this place.</p>
          <button 
            onClick={() => setActiveScreen(AppScreen.CHAT)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 active:scale-95 transition-transform"
          >
            Start Chat
          </button>
        </div>
        <i className="fa-solid fa-robot text-8xl absolute -right-4 -bottom-4 text-white/5 rotate-12"></i>
      </section>

      {isLoading && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-indigo-600 font-black uppercase tracking-widest text-xs animate-pulse">Processing Request...</p>
        </div>
      )}
    </div>
  );

  const renderInfo = () => (
    <div className="p-6">
      <button 
        onClick={() => setActiveScreen(AppScreen.HOME)}
        className="mb-6 text-slate-400 flex items-center gap-2 text-sm font-medium"
      >
        <i className="fa-solid fa-arrow-left"></i> Home
      </button>
      
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="h-40 bg-indigo-50 flex items-center justify-center relative">
          <img 
            src={`https://picsum.photos/seed/${location?.name || 'place'}/800/400`} 
            alt="Place" 
            className="w-full h-full object-cover opacity-80" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent"></div>
        </div>
        
        <div className="px-6 pb-8 -mt-10 relative z-10">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-50 mb-6">
            <h2 className="text-2xl font-black text-slate-800 leading-tight mb-1">{location?.name}</h2>
            <p className="text-indigo-600 font-bold uppercase text-[10px] tracking-widest">{location?.type}</p>
          </div>

          <div className="prose prose-slate max-w-none text-slate-600 space-y-4">
            {!info.text ? (
               <div className="py-10 text-center text-slate-400 italic">No information loaded.</div>
            ) : info.text.split('\n').map((line, i) => (
              <p key={i} className={line.startsWith('#') ? 'font-bold text-slate-800' : ''}>
                {line.replace(/^#+ /, '')}
              </p>
            ))}
          </div>

          {info.sources && info.sources.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Sources</h4>
              <div className="flex flex-wrap gap-2">
                {info.sources.map((s, i) => (
                  <a 
                    key={i} 
                    href={s.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] bg-slate-100 px-3 py-1 rounded-full text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                  >
                    <i className="fa-solid fa-link"></i> {s.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Layout 
      activeScreen={activeScreen} 
      onNavigate={setActiveScreen} 
      title="SmartInfoQueue"
    >
      {activeScreen === AppScreen.HOME && renderHome()}
      {activeScreen === AppScreen.INFO && renderInfo()}
      {activeScreen === AppScreen.QUIZ && (
        <div className="h-full">
           <button 
            onClick={() => setActiveScreen(AppScreen.HOME)}
            className="p-6 pb-0 text-slate-400 flex items-center gap-2 text-sm font-medium"
          >
            <i className="fa-solid fa-arrow-left"></i> Home
          </button>
          <QuizModule questions={quiz} locationName={location?.name || 'this location'} />
        </div>
      )}
      {activeScreen === AppScreen.CHAT && (
        <div className="flex flex-col h-full bg-slate-50">
          <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
            <button onClick={() => setActiveScreen(AppScreen.HOME)} className="text-slate-400">
              <i className="fa-solid fa-arrow-left"></i>
            </button>
            <div className="text-center">
              <h3 className="font-bold text-slate-800">Smart Assistant</h3>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Ready to Help</p>
            </div>
            <div className="w-6"></div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll">
            {chatHistory.length === 0 && (
              <div className="text-center py-10 px-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                  <i className="fa-solid fa-robot text-2xl"></i>
                </div>
                <h4 className="font-bold text-slate-800">Need some info?</h4>
                <p className="text-slate-500 text-sm">Ask me about services, waiting times, or things to do nearby at {location?.name}.</p>
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                }`}>
                  {msg.isThinking && <i className="fa-solid fa-spinner animate-spin mr-2"></i>}
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-white border-t border-slate-200">
            <div className="flex items-center gap-3 mb-3 px-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${isDeepThinking ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                  <input type="checkbox" className="hidden" checked={isDeepThinking} onChange={() => setIsDeepThinking(!isDeepThinking)} />
                  <div className={`w-3 h-3 bg-white rounded-full transition-transform ${isDeepThinking ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Deep Reasoning</span>
              </label>
            </div>
            <div className="flex gap-2">
              <input 
                type="text"
                className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                placeholder="Type your question..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button 
                onClick={handleSendMessage}
                disabled={!chatInput.trim()}
                className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg disabled:opacity-50"
              >
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {showMap && (
        <MapPicker 
          initialLocation={location} 
          onLocationSelect={(lat, lon) => reverseGeocode(lat, lon)}
          onClose={() => setShowMap(false)}
        />
      )}
    </Layout>
  );
};

export default App;
