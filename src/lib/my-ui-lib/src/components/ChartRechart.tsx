import React from "react";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

type ChartRechartProps = {
  data?: { name: string; value: number }[];
};

const ChartRechart: React.FC<ChartRechartProps> = ({ data = [] }) => {
  const sampleData = data.length
    ? data
    : [
        { name: "Jan", value: 40 },
        { name: "Feb", value: 30 },
        { name: "Mar", value: 20 },
        { name: "Apr", value: 27 },
      ];

  return (
    <div className="w-full h-64 bg-white rounded-2xl shadow p-4 overflow-x-auto">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sampleData}>
          <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChartRechart;
