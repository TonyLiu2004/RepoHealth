import { PieChart, Pie, ResponsiveContainer, Cell, Tooltip } from 'recharts';

const RepoPieChart = ({ active, inactive }: { active: number; inactive: number }) => {
  const data = [
    { name: 'Active', value: active, color: '#28a745' },
    { name: 'Inactive', value: inactive, color: '#dc3545' }
  ];

  return (
    <div style={{ width: '300px', height: '300px' }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
export default RepoPieChart;