import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Eye, MapPin, Trash2 } from "lucide-react";
import type { SavedPrediction } from "../utils/savedPredictions";

interface Props {
  predictions: SavedPrediction[];
  onDelete: (id: number) => void;
  onView: (prediction: SavedPrediction) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SavedPredictionsPanel({
  predictions,
  onDelete,
  onView,
}: Props) {
  return (
    <div className="card-surface p-5">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Calendar size={14} className="text-electric" />
        Saved Predictions
        <span className="ml-auto text-xs text-muted-foreground">
          {predictions.length} saved
        </span>
      </h3>

      {predictions.length === 0 ? (
        <div className="text-center py-6" data-ocid="saved.empty_state">
          <Calendar size={32} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No saved predictions yet
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Click "Save Prediction" on the forecast chart
          </p>
        </div>
      ) : (
        <ScrollArea className="max-h-64 scrollbar-dark">
          <div className="space-y-2" data-ocid="saved.list">
            {predictions.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border hover:border-primary/50 transition-all"
                data-ocid={`saved.item.${i + 1}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={11} className="text-electric flex-shrink-0" />
                    <span className="text-xs font-medium text-foreground truncate">
                      {p.locality}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(p.created_at)}
                  </p>
                  <p className="text-xs text-electric mt-0.5 font-mono">
                    {p.predictions[0]?.demand_mw.toLocaleString()}–
                    {p.predictions[4]?.demand_mw.toLocaleString()} MW
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => onView(p)}
                    data-ocid={`saved.edit_button.${i + 1}`}
                  >
                    <Eye size={13} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(p.id)}
                    data-ocid={`saved.delete_button.${i + 1}`}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
