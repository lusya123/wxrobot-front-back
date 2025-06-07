"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"

const data = [
  {
    name: "周一",
    total: 132,
    ai: 89,
    human: 43,
  },
  {
    name: "周二",
    total: 156,
    ai: 102,
    human: 54,
  },
  {
    name: "周三",
    total: 142,
    ai: 98,
    human: 44,
  },
  {
    name: "周四",
    total: 159,
    ai: 110,
    human: 49,
  },
  {
    name: "周五",
    total: 187,
    ai: 123,
    human: 64,
  },
  {
    name: "周六",
    total: 63,
    ai: 45,
    human: 18,
  },
  {
    name: "周日",
    total: 41,
    ai: 30,
    human: 11,
  },
]

export function DashboardChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
            border: "none",
            backdropFilter: "blur(8px)",
          }}
          itemStyle={{ padding: "4px 0" }}
          labelStyle={{ fontWeight: "bold", marginBottom: "4px" }}
        />
        <Legend
          verticalAlign="top"
          height={36}
          formatter={(value) => {
            const labels = {
              ai: "AI对话",
              human: "人工对话",
            }
            return labels[value as keyof typeof labels] || value
          }}
        />
        <Bar
          dataKey="ai"
          stackId="a"
          fill="hsl(var(--primary))"
          radius={[4, 4, 0, 0]}
          name="AI对话"
          animationDuration={1500}
        />
        <Bar
          dataKey="human"
          stackId="a"
          fill="#34c759"
          radius={[4, 4, 0, 0]}
          name="人工对话"
          animationDuration={1500}
          animationBegin={300}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
