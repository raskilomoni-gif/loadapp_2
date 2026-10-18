import React, { useState } from 'react';
import { 
  X, 
  Star, 
  CheckCircle2, 
  ThumbsUp, 
  MessageSquare, 
  Award,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ReviewData } from '../types/logistics';

interface RatingReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  reviewerRole: 'shipper' | 'trucker';
  reviewerName: string;
  targetRole: 'shipper' | 'trucker';
  targetName: string;
  onSubmitReview: (review: ReviewData) => void;
}

export const RatingReviewModal: React.FC<RatingReviewModalProps> = ({
  isOpen,
  onClose,
  tripId,
  reviewerRole,
  reviewerName,
  targetRole,
  targetName,
  onSubmitReview,
}) => {
  const [overallRating, setOverallRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);

  // Criteria ratings depending on who is reviewing
  const isShipperReviewing = reviewerRole === 'shipper';

  const defaultCriteria = isShipperReviewing ? [
    { label: 'Timeliness & Punctuality', rating: 5 },
    { label: 'Cargo Care & Tie-Down Safety', rating: 5 },
    { label: 'Communication & Professionalism', rating: 5 },
  ] : [
    { label: 'Dock Turnaround & Loading Speed', rating: 5 },
    { label: 'Facility Access & Bay Clearance', rating: 5 },
    { label: 'Prompt Escrow & Payment Release', rating: 5 },
  ];

  const [criteriaRatings, setCriteriaRatings] = useState(defaultCriteria);

  // Quick Tags
  const availableTags = isShipperReviewing ? [
    'On-Time Delivery',
    'Pristine Cargo',
    'Careful Driving',
    'Professional Communication',
    'Clean Equipment',
    'Smooth Escrow Handshake',
  ] : [
    'Rapid Dock Bay Access',
    'Clear Facility Directions',
    'Instant Payment Clearance',
    'Helpful Forklift Crew',
    'Accurate Cargo Weight',
    'Driver Lounge Available',
  ];

  const [selectedTags, setSelectedTags] = useState<string[]>([availableTags[0], availableTags[1]]);
  const [comment, setComment] = useState(
    isShipperReviewing 
      ? 'Exceptional service! Driver arrived promptly, verified fuel escrow terms without hesitation, and secured the CNC machine with extreme care. Delivered ahead of schedule in flawless condition.'
      : 'Top-tier shipper. Warehouse team had the dock ready immediately upon arrival. Mutual fuel escrow was authorized within seconds of arrival at Bay 14-B. Would haul for them anytime.'
  );

  if (!isOpen) return null;

  const ratingDescriptions: Record<number, string> = {
    1: 'Poor - Major issues occurred',
    2: 'Fair - Below expectations',
    3: 'Good - Standard haul completed',
    4: 'Very Good - Smooth & reliable',
    5: 'Outstanding - Flawless execution & highly recommended',
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleCriteriaChange = (index: number, val: number) => {
    setCriteriaRatings((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], rating: val };
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const review: ReviewData = {
      id: `rev-${Date.now()}`,
      tripId,
      reviewerRole,
      reviewerName,
      targetRole,
      targetName,
      rating: overallRating,
      subRatings: criteriaRatings,
      tags: selectedTags,
      comment: comment.trim(),
      createdAt: 'Just now',
    };

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#10b981', '#3b82f6'],
    });

    onSubmitReview(review);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">
                Rate & Review {targetRole === 'trucker' ? 'Carrier Driver' : 'Cargo Shipper'}
              </h3>
              <p className="text-xs text-slate-400">
                Provide feedback for <strong className="text-white">{targetName}</strong> on Trip #{tripId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Main Star Rating */}
          <div className="text-center p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Overall Experience Rating
            </span>

            <div className="flex items-center justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (hoverRating || overallRating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setOverallRating(star)}
                    className="p-1 text-slate-700 hover:scale-110 transition-transform focus:outline-none"
                  >
                    <Star
                      className={`w-9 h-9 transition-colors ${
                        isFilled
                          ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                          : 'text-slate-700'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <p className="text-xs font-bold text-amber-400">
              {ratingDescriptions[hoverRating || overallRating]}
            </p>
          </div>

          {/* Sub-Criteria Ratings */}
          <div className="space-y-3 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
            <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">
              Detailed Performance Metrics
            </span>
            {criteriaRatings.map((crit, idx) => (
              <div key={crit.label} className="flex items-center justify-between text-xs">
                <span className="text-slate-300">{crit.label}</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleCriteriaChange(idx, s)}
                      className="p-0.5 focus:outline-none"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          crit.rating >= s
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-mono font-bold text-slate-400 ml-1.5 w-4">
                    {crit.rating}.0
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Compliment Tags */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
              Select Highlights & Praise Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-medium'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Written Feedback Comment */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Written Testimonial / Public Feedback
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe your experience with this carrier or shipper..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 leading-relaxed"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-450 text-slate-950 shadow-lg shadow-amber-500/25 active:scale-[0.98] transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Submit Verified Review</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
