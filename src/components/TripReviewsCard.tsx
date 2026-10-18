import React from 'react';
import { 
  Star, 
  Award, 
  MessageSquare, 
  CheckCircle2, 
  Sparkles, 
  ThumbsUp, 
  ShieldCheck, 
  User, 
  Truck,
  Plus
} from 'lucide-react';
import { Trip, ReviewData } from '../types/logistics';

interface TripReviewsCardProps {
  trip: Trip;
  currentRole: 'shipper' | 'trucker';
  onOpenReviewModal: () => void;
}

export const TripReviewsCard: React.FC<TripReviewsCardProps> = ({
  trip,
  currentRole,
  onOpenReviewModal,
}) => {
  const isTripCompleted = trip.status === 'COMPLETED' || trip.status === 'DELIVERED';
  const shipperReview = trip.shipperReview;
  const driverReview = trip.driverReview;

  const currentRoleHasReviewed = 
    currentRole === 'shipper' ? Boolean(shipperReview) : Boolean(driverReview);

  // Render a review item
  const renderReviewItem = (review: ReviewData, title: string, subtitle: string) => {
    return (
      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
              {review.reviewerRole === 'shipper' ? <User className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-xs">{review.reviewerName}</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                  {review.reviewerRole === 'shipper' ? 'Cargo Owner' : 'Carrier Driver'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">{subtitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-xs font-bold text-amber-300">{review.rating}.0</span>
          </div>
        </div>

        {/* Sub-Criteria breakdown */}
        {review.subRatings && review.subRatings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {review.subRatings.map((sub) => (
              <div key={sub.label} className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 truncate block">{sub.label}</span>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-bold text-white">{sub.rating}.0</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Praise Badges */}
        {review.tags && review.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {review.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] bg-amber-950/40 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3 text-amber-400" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Comment quote */}
        <p className="text-xs text-slate-300 italic bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
          "{review.comment}"
        </p>

        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verified Post-Delivery Feedback
          </span>
          <span>{review.createdAt}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">Mutual Trip Rating & Reviews</h3>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                POST-DELIVERY
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Transparent mutual reviews between cargo owner and carrier upon delivery completion
            </p>
          </div>
        </div>

        {/* Action button if active user has not yet reviewed */}
        {!currentRoleHasReviewed && isTripCompleted && (
          <button
            onClick={onOpenReviewModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-450 text-slate-950 transition shadow-lg shadow-amber-500/20 active:scale-[0.98]"
          >
            <Star className="w-3.5 h-3.5 fill-slate-950" />
            <span>Leave Rating & Review</span>
          </button>
        )}
      </div>

      {/* Review Callout if pending */}
      {!currentRoleHasReviewed && isTripCompleted && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-300">
                {currentRole === 'shipper' 
                  ? `How was your experience with ${trip.trucker?.name}?` 
                  : `Rate your experience at ${trip.shipperName.split(' ')[0]}'s dock!`}
              </h4>
              <p className="text-[11px] text-slate-400">
                Help build the trust network by sharing your ratings on punctuality, escrow cooperation, and communication.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenReviewModal}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 whitespace-nowrap shadow-md shadow-amber-500/20"
          >
            Submit Review Now
          </button>
        </div>
      )}

      {/* Display Both Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Shipper Review for Driver */}
        {shipperReview ? (
          renderReviewItem(
            shipperReview,
            'Cargo Owner Review',
            `Feedback for Driver ${trip.trucker?.name}`
          )
        ) : (
          <div className="p-6 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-center flex flex-col items-center justify-center space-y-2">
            <div className="p-2 rounded-xl bg-slate-800 text-slate-500">
              <User className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-400">Cargo Owner Review</span>
            <p className="text-[11px] text-slate-500 max-w-[220px]">
              {isTripCompleted
                ? 'Shipper has not submitted feedback yet.'
                : 'Available once shipment reaches final delivery.'}
            </p>
            {currentRole === 'shipper' && isTripCompleted && (
              <button
                onClick={onOpenReviewModal}
                className="mt-1 text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Rate Driver
              </button>
            )}
          </div>
        )}

        {/* Driver Review for Shipper */}
        {driverReview ? (
          renderReviewItem(
            driverReview,
            'Driver Carrier Review',
            `Feedback for Shipper ${trip.shipperName.split(' ')[0]}`
          )
        ) : (
          <div className="p-6 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-center flex flex-col items-center justify-center space-y-2">
            <div className="p-2 rounded-xl bg-slate-800 text-slate-500">
              <Truck className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-400">Carrier Driver Review</span>
            <p className="text-[11px] text-slate-500 max-w-[220px]">
              {isTripCompleted
                ? 'Truck driver has not submitted feedback yet.'
                : 'Available once shipment reaches final delivery.'}
            </p>
            {currentRole === 'trucker' && isTripCompleted && (
              <button
                onClick={onOpenReviewModal}
                className="mt-1 text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Rate Shipper Dock
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
