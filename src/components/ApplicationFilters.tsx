
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";

interface ApplicationFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  scoreFilter: string;
  onScoreFilterChange: (value: string) => void;
  onClearFilters: () => void;
}

export const ApplicationFilters = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  scoreFilter,
  onScoreFilterChange,
  onClearFilters,
}: ApplicationFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by name, email, or job title..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="shortlisted">Shortlisted</SelectItem>
          </SelectContent>
        </Select>

        <Select value={scoreFilter} onValueChange={onScoreFilterChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by score" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Scores</SelectItem>
            <SelectItem value="90+">90%+</SelectItem>
            <SelectItem value="80-89">80-89%</SelectItem>
            <SelectItem value="70-79">70-79%</SelectItem>
            <SelectItem value="below-70">Below 70%</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={onClearFilters} size="sm">
          <X className="w-4 h-4 mr-2" />
          Clear
        </Button>
      </div>
    </div>
  );
};
