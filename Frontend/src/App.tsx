import { useState, useEffect } from 'react'
import RepoDisplay from './components/repoDisplay'
import './App.css'

const API_BASE = "http://localhost:8000";

interface Repo {
  id: number;
  name: string;
  html_url: string;
}

function App() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [userInputUrl, setUserInputUrl] = useState("");
  const [selectedRepos, setSelectedRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Record<string, any>>({});

  // Check URL for token (if backend redirects back with it)
  useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('token');
      
      if (tokenFromUrl) {
        localStorage.setItem('token', tokenFromUrl); // Save it        
        // cleans the URL to remove the token for security reasons
        window.history.replaceState({}, document.title, "/");
      }

      if (localStorage.getItem('token')) {
        fetchRepos();
      }
    }, []);

  const logout = () => {
    localStorage.removeItem('token');
    setRepos([]);
    setAnalysis({});
    setSelectedRepos([]);
  };

  const fetchRepos = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/repos`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    console.log(data);
    if (data.status === '401') {
      localStorage.removeItem('token');
      setRepos([]);
      setAnalysis({});
      setSelectedRepos([]);
    } else {
      setRepos(data);
    }
  };

  const handleAnalyze = async (repoUrl: string) => {
    const token = localStorage.getItem('token');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/analyze?repo=${encodeURIComponent(repoUrl)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      setAnalysis(prev => ({
        ...prev,     
        [repoUrl]: data      
      }));
    } catch (err) {
      alert("Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const analyzeAll = async () => {
    setLoading(true);
    setAnalysis({});
    for (const repo of selectedRepos) {
      await handleAnalyze(repo.html_url);
    }
  };

  const toggleRepo = (repo: Repo) => {
    setSelectedRepos(prev => 
      prev.some(r => r.html_url === repo.html_url)
        ? prev.filter(r => r.html_url !== repo.html_url)
        : [...prev, repo]
    );
  };

  const handleAddRepo = (userInputUrl: string) => {
    try {
      new URL(userInputUrl);
      const repo: Repo = { id: Date.now(), name: userInputUrl, html_url: userInputUrl };
      toggleRepo(repo);
      setUserInputUrl("");
    } catch (err) {
      alert("Please enter a valid Repository URL");
    }
  };

  if (!localStorage.getItem('token')) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1 className='repohealth'>RepoHealth</h1>
          <p className="login-subtitle">Check the health of your GitHub repositories</p>
          <a href={`${API_BASE}/login`} className="login-btn">
            Login with GitHub
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <h1 className="repohealth">RepoHealth</h1>
      <button id="logout-btn" onClick={logout}>Logout</button>

      {loading ? 
        <span className="spinner" style={{margin: '0 auto'}}></span> 
      : null}

      <RepoDisplay analysis={analysis} />

      <button 
        id="analyze-btn"
        onClick={() => analyzeAll()} 
        disabled={loading || selectedRepos.length === 0}
      >
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      <section id="control-section">
        <input 
          type="text" 
          placeholder="Enter repository URL" 
          value={userInputUrl}
          onChange={(e) => setUserInputUrl(e.target.value)}
        />
        <button id="add-repo-btn" onClick={() => handleAddRepo(userInputUrl)}>
          Add URL
        </button>
      </section>

      <section id="repo-columns">
        <div style={{flex: 1}}>
          <h2>Your Repositories:</h2>
          {repos.length > 0 && (
            <section id="repo-list">
              <div id="repo-items">
                {repos.map((repo: Repo) => (
                  <div key={repo.id}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedRepos.some(r => r.html_url === repo.html_url)}
                        onChange={() => toggleRepo(repo)}
                      />
                      <div className="repo-item">{repo.name}</div>
                    </label>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div style={{flex: 1}}>
          <h3>Selected Repositories:</h3>
          {selectedRepos.length > 0 && (
            <section id="selected-repos">
              <ul>
                {selectedRepos.map((repo) => (
                  <li key={repo.html_url} style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => toggleRepo(repo)}>
                    <span className='repo-items'>
                      <div className="repo-item" id="selected-repos-btn">{repo.name}</div>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </section>
    </>
  )
}

export default App
