import { useState } from "react";
import { Star } from "lucide-react";
import Header from "@/components/Header";

import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Reviews = () => {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || rating === 0 || !comment.trim()) {
      toast.error("Please fill all fields and select a rating.");
      return;
    }
    setSubmitting(true);
    // For now just show success since we don't have a reviews table yet
    toast.success("Thank you for your review!");
    setName("");
    setRating(0);
    setComment("");
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 max-w-lg mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-display text-3xl font-black text-foreground">Your Opinion Matters</h1>
          <p className="text-muted-foreground">Share your experience with Tech Subx Bd.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div>
            <label className="text-sm font-medium text-foreground">Your Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" className="mt-1" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Rating</label>
            <div className="flex gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1"
                >
                  <Star
                    className={`h-8 w-8 transition-all duration-150 hover-star-sparkle hover:scale-125 ${
                      star <= (hoverRating || rating)
                        ? "fill-primary text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Your Review</label>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write your review..." className="mt-1" rows={4} />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </main>
      <BottomNav />
    </div>
  );
};

export default Reviews;
