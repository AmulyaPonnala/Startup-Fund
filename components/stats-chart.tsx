"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts"

const data = [
  { date: "Mar", value: 3000000 },
  { date: "Apr", value: 3500000 },
  { date: "May", value: 2000000 },
  { date: "Jun", value: 4000000 },
  { date: "Jul", value: 3000000 },
  { date: "Aug", value: 2000000 },
  { date: "Sep", value: 4500000 },
  { date: "Oct", value: 5000000 },
  { date: "Nov", value: 4800000 },
  { date: "Dec", value: 4000000 },
  { date: "Jan", value: 3500000 },
  { date: "Feb", value: 4000000 },
]

export function StatsChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">Funding</span>
                        <span className="font-bold text-muted-foreground">
                          ${payload[0]?.value?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">Month</span>
                        <span className="font-bold">{payload[0].payload.date}</span>
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

