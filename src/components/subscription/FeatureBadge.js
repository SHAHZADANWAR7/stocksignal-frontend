import React from "react";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export default function FeatureBadge({ type = "pro" }) {
  if (type === "free") {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
        Free
      </Badge>
    );
  }
  
  return (
    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
      <Sparkles className="w-3 h-3 mr-1" />
      Pro
    </Badge>
  );
}
