import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/** Monthly revenue data */
const data = [
  { name: "Janv", value: 45 },
  { name: "Fev", value: 55 },
  { name: "Mar", value: 75 },
  { name: "Avr", value: 60 },
  { name: "Mai", value: 42 },
  { name: "Jui", value: 65 },
  { name: "Juil", value: 37 },
  { name: "Aout", value: 95 },
];

/** Revenue chart component showing monthly income trend */
const RevenueChart = () => {
  return (
    <div className="bg-card rounded-2xl shadow-sm p-5 lg:p-6 flex flex-col">
      <h3 className="text-lg font-extrabold text-foreground text-center mb-4 tracking-wide uppercase">
        Revenue Mensuel
      </h3>
      <div className="flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(220 13% 91%)" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 13, fill: "hsl(0 0% 45%)" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 13, fill: "hsl(0 0% 45%)" }}
              domain={[30, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#007BFF",
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontSize: "13px",
                fontWeight: 600,
              }}
              formatter={(value: number) => [`${value * 34}€`, ""]}
              labelStyle={{ display: "none" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#007BFF"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "hsl(217 91% 60%)", stroke: "hsl(217 91% 60%)" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;
