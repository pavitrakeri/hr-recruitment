
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

interface EmptyStatesProps {
  type: 'no-matches' | 'no-applications';
  onClearFilters?: () => void;
}

export const EmptyStates = ({ type, onClearFilters }: EmptyStatesProps) => {
  if (type === 'no-matches') {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No applications match your filters</h3>
        <p className="text-gray-500">Try adjusting your search criteria or clear the filters.</p>
        {onClearFilters && (
          <Button variant="outline" onClick={onClearFilters} className="mt-4">
            Clear Filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
      <p className="text-gray-500">Applications will appear here when candidates apply to your jobs.</p>
    </div>
  );
};
