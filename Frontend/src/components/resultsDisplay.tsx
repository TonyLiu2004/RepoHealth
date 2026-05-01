
const ResultsDisplay = ({ results }: Record<string, any>) => {
    return (
        <section>
            <pre>{JSON.stringify(results ?? { message: 'No results available yet' }, null, 2)}</pre>

        </section>
    )
};
export default ResultsDisplay;
