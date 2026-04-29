import { useState, useEffect } from 'react'
import './App.css'

const API_BASE = "http://localhost:8000";

function App() {
  const [repos, setRepos] = useState([]);
  const [userInputUrl, setUserInputUrl] = useState("");
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Record<string, any>>({});
  // Check URL for token (if backend redirects back with it)
  useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('token'); // or 'access_token'
      
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
    setRepos(data);
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
    for (const repoUrl of selectedRepos) {
      await handleAnalyze(repoUrl);
    }
  };

  const toggleRepo = (repoName: string) => {
    setSelectedRepos(prev => 
      prev.includes(repoName)
        ? prev.filter(r => r !== repoName)
        : [...prev, repoName]
    );
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

      {analysis && Object.keys(analysis).length > 0 && (
        <section style={{padding: '24px'}}>
          <h2>Analysis Results:</h2>
          <div className="results-list">
            {Object.entries(analysis).map(([repoUrl, result]) => (
              <div key={repoUrl} className="result-item">
                <h3>{repoUrl}</h3>
                <pre>{JSON.stringify(result, null, 2)}</pre>
              </div>
            ))}
          </div>
        </section>
      )} 

      <section id="control-section">
        <input 
          type="text" 
          placeholder="Enter repository URL" 
          value={userInputUrl}
          onChange={(e) => setUserInputUrl(e.target.value)}
        />
        <button id="add-repo-btn" onClick={() => {
          if (userInputUrl) {
            toggleRepo(userInputUrl);
            setUserInputUrl("");
          }
        }}>
          Add URL
        </button>

        <button 
          id="analyze-btn"
          onClick={() => analyzeAll()} 
          disabled={loading || selectedRepos.length === 0}
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </section>

      <section id="repo-columns">
        <div style={{flex: 1}}>
          <h2>Your Repositories:</h2>
          {repos.length > 0 && (
            <section id="repo-list">
              <div id="repo-items">
                {repos.map((repo: any) => (
                  <div key={repo.id}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedRepos.includes(repo.html_url)}
                        onChange={() => toggleRepo(repo.html_url)}
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
                {selectedRepos.map((url) => (
                  <li key={url} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span 
                      onClick={() => toggleRepo(url)}
                      className='repo-items' 
                    >
                      <div className="repo-item" id="selected-repos-btn">{url}</div>
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
