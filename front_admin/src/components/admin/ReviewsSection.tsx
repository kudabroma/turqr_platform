import { Star } from "lucide-react";

const mockReviews = [
  { id: 1, name: "Sarah M.", rating: 5, text: "Very cozy, fresh food, friendly staff" },
  { id: 2, name: "Ahmed K.", rating: 4, text: "Nice atmosphere and good prices" },
];

export function ReviewsSection() {
  return (
    <div className="px-4 mt-8">
      <h2 className="text-xl font-bold text-foreground mb-4">Reviews</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
        {mockReviews.map((review) => (
          <div
            key={review.id}
            className="min-w-[260px] bg-muted rounded-xl p-4 shrink-0"
          >
            <div className="flex gap-0.5 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-4 w-4 ${s <= review.rating ? "fill-primary text-primary" : "text-border"}`}
                />
              ))}
            </div>
            <p className="text-sm text-foreground mb-2">"{review.text}"</p>
            <p className="text-xs text-muted-foreground">— {review.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
