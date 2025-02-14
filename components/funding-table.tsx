import { Avatar } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MoreHorizontal } from "lucide-react"

const fundingOpportunities = [
  {
    name: "Tech Innovators Fund",
    type: "Venture Capital",
    minInvestment: "$500,000",
    maxInvestment: "$5,000,000",
    focus: "AI & Machine Learning",
    stage: "Series A",
    location: "San Francisco, CA",
    matchScore: "95%",
  },
  {
    name: "Green Energy Accelerator",
    type: "Accelerator",
    minInvestment: "$50,000",
    maxInvestment: "$250,000",
    focus: "Clean Energy",
    stage: "Seed",
    location: "Austin, TX",
    matchScore: "88%",
  },
  {
    name: "HealthTech Angels",
    type: "Angel Network",
    minInvestment: "$100,000",
    maxInvestment: "$1,000,000",
    focus: "Healthcare Technology",
    stage: "Early Stage",
    location: "Boston, MA",
    matchScore: "82%",
  },
]

export function FundingTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Opportunity</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Investment Range</TableHead>
          <TableHead>Focus</TableHead>
          <TableHead>Stage</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Match Score</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fundingOpportunities.map((opportunity) => (
          <TableRow key={opportunity.name}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <img src={`/placeholder.svg?height=24&width=24`} alt={opportunity.name} />
                </Avatar>
                <div>{opportunity.name}</div>
              </div>
            </TableCell>
            <TableCell>{opportunity.type}</TableCell>
            <TableCell>{`${opportunity.minInvestment} - ${opportunity.maxInvestment}`}</TableCell>
            <TableCell>{opportunity.focus}</TableCell>
            <TableCell>{opportunity.stage}</TableCell>
            <TableCell>{opportunity.location}</TableCell>
            <TableCell>
              <span className="inline-flex items-center rounded-full px-2 py-1 text-xs bg-green-500/10 text-green-500">
                {opportunity.matchScore}
              </span>
            </TableCell>
            <TableCell>
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

