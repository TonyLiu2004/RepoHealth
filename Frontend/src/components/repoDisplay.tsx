import { useState } from 'react'
import './repoDisplay.css'
import ResultsDisplay from './resultsDisplay';
import RepoPieChart from './repoPieChart';

const getRepoNameFromUrl = (repoUrl: string) => {
  try {
    const url = new URL(repoUrl);
    const segments = url.pathname.split('/').filter(Boolean);
    return segments.length > 0 ? segments[segments.length - 1] : repoUrl;
  } catch {
    return repoUrl;
  }
};

const RepoDisplay = ({ analysis }: Record<string, any>) => {
  const [selectedAnalysis, setSelectedAnalysis] = useState<Record<string, any>>({});

  console.log(analysis)
  return (
    <section id="repo-display-container">
      <div className="repo-display-left">
        <h2>Analysis</h2>
        <table className="repo-table">
          <thead>
            <tr>
              <th>Repo Name</th>
            </tr>
          </thead>
          <tbody>
            {!analysis || Object.keys(analysis).length === 0 ? (
              <tr>
                <td className="empty-row">No analyzed repos yet</td>
              </tr>
            ) : (
              Object.entries(analysis).map(([repoUrl, result]) => {
                const repoName = getRepoNameFromUrl(repoUrl);
                const isSelected = selectedAnalysis['repo'] === repoUrl;

                return (
                  <tr
                    key={repoUrl}
                    className={isSelected ? 'selected' : ''}
                    onClick={() => setSelectedAnalysis(result as Record<string, any>)}
                  >
                    <td>{repoName}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="repo-display-right">
        {selectedAnalysis ? (
          <div className="repo-result-card">
            <h2>{getRepoNameFromUrl(selectedAnalysis['repo'])}</h2>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', margin: 'auto' }}>
              <RepoPieChart active={selectedAnalysis['active_links']} inactive={selectedAnalysis['total_links'] - selectedAnalysis['active_links']} />
              <div style={{ marginLeft: '2rem' }}>
                {selectedAnalysis['file_analysis'] ? 
                  <div>
                    <div>Scanned {selectedAnalysis['files_scanned']} files</div>
                    <div>{selectedAnalysis['active_links']} / {selectedAnalysis['total_links']} Active Links</div>
                  </div>
                 : null
                }
                
              </div>
            </div>
            <ResultsDisplay results={selectedAnalysis['file_analysis'] ?? null} />
          </div>
        ) : (
          <div className="empty-state">Select an analyzed repo on the left to see results.</div>
        )}
      </div>
    </section>
  );
};

export default RepoDisplay;
