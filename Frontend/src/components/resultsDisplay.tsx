import './resultsDisplay.css'

const ResultsDisplay = ({ results }: Record<string, any>) => {
    if (!results) {
        return <section>No results available yet</section>;
    }

    const linkMap = new Map<string, Record<string, any>>();

    for (const [path, analysis] of Object.entries(results)) {
        for (const [url, info] of Object.entries(analysis as any)) {
            if (!linkMap.has(url)) {
                linkMap.set(url, {
                    status: info.status,
                    active: info.active,
                    note: info.note || "",
                    files: [path]
                });
                continue;
            }

            const existing = linkMap.get(url)!;
            if (!existing.files.includes(path)) {
                existing.files.push(path);
            }
        }
    }

    return (
        <section style={{ width: '100%'}}>
            {Array.from(linkMap.entries()).map(([url, info]) => (
                <div
                    key={url}
                    className="hover-row"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: '1rem',
                        justifyItems: 'start',
                        padding: '0.4rem 0',
                        margin: '0 2%',
                    }}
                >
                    <div style={{ position: 'relative', overflowWrap: 'anywhere', textAlign: 'left' }}>
                        <span>{url}</span>
                        <span className="hover-files">{info.files.join(', ')}</span>
                    </div>
                    <span style={{ color: info.active ? 'green' : 'red', whiteSpace: 'nowrap' }}>
                        {info.active ? 'Active' : 'Inactive'}
                        {info.note ? ` (${info.note})` : ''}
                    </span>
                </div>
            ))}
        </section>
    );
};
export default ResultsDisplay;
