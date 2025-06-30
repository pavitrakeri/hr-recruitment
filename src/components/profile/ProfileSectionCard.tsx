import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

interface ProfileSectionCardProps {
  title: string;
  children: React.ReactNode;
  onEdit?: () => void;
  className?: string;
}

export const ProfileSectionCard = ({ title, children, onEdit, className }: ProfileSectionCardProps) => {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {onEdit && (
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Pencil className="w-4 h-4 text-gray-500" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}; 