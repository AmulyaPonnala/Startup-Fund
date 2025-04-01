import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MetricsCard } from "@/components/metrics-card"
import { StatsChart } from "@/components/stats-chart"
import { FundingTable } from "@/components/funding-table"
import { ProfileButton } from "@/components/auth/ProfileButton"
import {
  BarChart3,
  ChevronDown,
  Globe,
  Home,
  LayoutDashboard,
  LifeBuoy,
  MessageSquare,
  Settings,
  Wallet,
} from "lucide-react"
import Link from "next/link"

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <div className="grid lg:grid-cols-[280px_1fr]">
        <aside className="border-r bg-white">
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <Wallet className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-blue-600">StartupFund</span>
          </div>
          <div className="px-4 py-4">
            <Input placeholder="Search" className="bg-gray-100" />
          </div>
          <nav className="space-y-2 px-2">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <BarChart3 className="h-4 w-4" />
              Funding Opportunities
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Globe className="h-4 w-4" />
              Investor Network
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Home className="h-4 w-4" />
              My Startup
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Wallet className="h-4 w-4" />
              Financial Planning
              <ChevronDown className="ml-auto h-4 w-4" />
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <LifeBuoy className="h-4 w-4" />
              Support
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </nav>
        </aside>
        <main className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">Startup Funding Overview</h1>
              <div className="text-sm text-muted-foreground">Aug 13, 2023 - Aug 18, 2023</div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/chat">
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  AI Assistant
                </Button>
              </Link>
              <ProfileButton />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <MetricsCard
              title="Total Funding Raised"
              value="$2,500,000"
              change={{ value: "+$500,000", percentage: "+25%", isPositive: true }}
            />
            <MetricsCard
              title="Current Runway"
              value="18 months"
              change={{ value: "+3 months", percentage: "+20%", isPositive: true }}
            />
            <MetricsCard
              title="Investor Meetings"
              value="12"
              change={{ value: "+3", percentage: "+33%", isPositive: true }}
            />
          </div>
          <Card className="mt-6 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Funding Trends</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost">
                  This Year
                </Button>
                <Button size="sm" variant="ghost">
                  Last Year
                </Button>
                <Button size="sm" variant="ghost">
                  All Time
                </Button>
              </div>
            </div>
            <StatsChart />
          </Card>
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-4">Recommended Funding Opportunities</h2>
            <FundingTable />
          </div>
        </main>
      </div>
    </div>
  )
}

