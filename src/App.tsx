import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { ShipperDashboard } from './components/ShipperDashboard';
import { DriverDashboard } from './components/DriverDashboard';
import { CreateCargoModal } from './components/CreateCargoModal';
import { ChatModal } from './components/ChatModal';
import { ProofOfDeliveryModal } from './components/ProofOfDeliveryModal';
import { RatingReviewModal } from './components/RatingReviewModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { SettingsModal } from './components/SettingsModal';
import { CancelLoadModal } from './components/CancelLoadModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AuthScreen } from './components/AuthScreen';
import { Marketplace } from './components/Marketplace';
import { INITIAL_TRIP, INITIAL_TRUCKERS } from './services/mockData';
import { Trip, Trucker, ProofOfDelivery, ReviewData } from './types/logistics';
import { AppSettings } from './types/settings';
import { DEFAULT_APP_SETTINGS } from './services/settingsDefaults';
import { formatCurrency, calculateDistanceKm, calculateFuelEscrowDeposit } from './services/routing';
import { getDieselPriceForCurrency } from './types/settings';
import { fetchAllTrips, fetchAllTruckers, saveTrip, saveTrucker } from './services/db';
import { fetchProfile, signOut as authSignOut } from './services/authService';
import { UserProfile } from './types/auth';
import { supabase } from './services/supabaseClient';
import confetti from 'canvas-confetti';
import { ShieldCheck, Sparkles, Fuel, CircleCheck as CheckCircle2, TriangleAlert as AlertTriangle, ArrowRight, Star, LogOut, Store } from 'lucide-react';

export default function App() {
  const [currentRole, setCurrentRole] = useState<'shipper' | 'trucker'>('shipper');
  const [trips, setTrips] = useState<Trip[]>([INITIAL_TRIP]);
  const [activeTripId, setActiveTripId] = useState<string>(INITIAL_TRIP.id);
  const [truckers, setTruckers] = useState<Trucker[]>(INITIAL_TRUCKERS);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const dataLoadedRef = useRef(false);

  // Auth state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const authInitRef = useRef(false);

  // App Settings (Company / Personal details, Banking, Currency, VAT/TIN)
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('freight_flow_settings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not read settings from localStorage', e);
    }
    return DEFAULT_APP_SETTINGS;
  });

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isPODModalOpen, setIsPODModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelModalRole, setCancelModalRole] = useState<'shipper' | 'driver'>('shipper');

  const handleSaveSettings = (newSettings: AppSettings) => {
    setAppSettings(newSettings);
    try {
      localStorage.setItem('freight_flow_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.error('Failed to persist settings', e);
    }
  };

  // Live GPS Simulation
  const [isSimulating, setIsSimulating] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(2);
  const simulationStepRef = useRef(1);

  // Active Trip
  const activeTrip = trips.find((t) => t.id === activeTripId) || trips[0];
  const assignedTrucker = truckers.find((t) => t.id === activeTrip.trucker?.id) || truckers[0];

  // Restore auth session on mount
  useEffect(() => {
    if (authInitRef.current) return;
    authInitRef.current = true;

    supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          if (profile) {
            setUserProfile(profile);
            setCurrentRole(profile.role === 'driver' ? 'trucker' : 'shipper');
          }
        } else {
          setUserProfile(null);
        }
        setAuthReady(true);
      })();
    });
  }, []);

  const handleAuthSuccess = (profile: UserProfile) => {
    setUserProfile(profile);
    setCurrentRole(profile.role === 'driver' ? 'trucker' : 'shipper');
    setShowMarketplace(true);
  };

  const handleSignOut = async () => {
    await authSignOut();
    setUserProfile(null);
    setShowMarketplace(false);
  };

  // Load data from Supabase on mount; seed mock data if DB is empty
  useEffect(() => {
    if (dataLoadedRef.current) return;
    dataLoadedRef.current = true;

    (async () => {
      try {
        const [dbTruckers, dbTrips] = await Promise.all([fetchAllTruckers(), fetchAllTrips()]);

        if (dbTruckers.length > 0) {
          setTruckers(dbTruckers);
        } else {
          for (const t of INITIAL_TRUCKERS) await saveTrucker(t);
        }

        if (dbTrips.length > 0) {
          setTrips(dbTrips);
          setActiveTripId(dbTrips[0].id);
        } else {
          await saveTrip(INITIAL_TRIP);
        }
      } catch (err) {
        console.warn('Supabase load failed, using local mock data:', err);
      } finally {
        setIsLoadingData(false);
      }
    })();
  }, []);

  // Debounced save: persist the active trip to Supabase whenever it changes
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (isLoadingData) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTrip(activeTrip).catch((err) => console.warn('Trip save failed:', err));
    }, 1500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [activeTrip, isLoadingData]);

  // Simulation tick loop
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setTrips((prevTrips) =>
        prevTrips.map((trip) => {
          if (trip.id !== activeTripId) return trip;
          if (!trip.routeWaypoints || trip.routeWaypoints.length === 0) return trip;

          const totalPoints = trip.routeWaypoints.length;
          let nextStep = simulationStepRef.current + 1;

          if (nextStep >= totalPoints) {
            setIsSimulating(false);
            nextStep = totalPoints - 1;

            // Trigger arrival milestone
            const updatedMilestones = trip.milestones.map((m) =>
              m.key === 'ARRIVED_DESTINATION'
                ? { ...m, completed: true, current: true, timestamp: 'Now' }
                : m
            );

            return {
              ...trip,
              status: 'DELIVERED',
              progressPercent: 100,
              currentSpeedMph: 0,
              currentLocation: {
                lat: trip.destination.lat,
                lng: trip.destination.lng,
              },
              milestones: updatedMilestones,
            };
          }

          simulationStepRef.current = nextStep;
          const [nextLat, nextLng] = trip.routeWaypoints[nextStep];
          const progress = Math.min(100, Math.round((nextStep / totalPoints) * 100));
          const simulatedSpeed = Math.floor(58 + Math.sin(nextStep) * 6);

          return {
            ...trip,
            currentLocation: { lat: nextLat, lng: nextLng },
            currentSpeedMph: simulatedSpeed,
            progressPercent: progress,
            status: progress > 15 && trip.status === 'AT_PICKUP' ? 'IN_TRANSIT' : trip.status,
          };
        })
      );
    }, 1000 / speedMultiplier);

    return () => clearInterval(interval);
  }, [isSimulating, speedMultiplier, activeTripId]);

  // Handle Mutual Escrow Approvals
  const handleShipperApproveEscrow = () => {
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== activeTripId) return t;

        const willBeBothApproved = t.escrow.truckerApproved;
        const newStatus = willBeBothApproved ? 'RELEASED_TO_TRUCKER' : t.escrow.status;

        // If both approved, credit trucker fuel card
        if (willBeBothApproved) {
          setTruckers((prevTruckers) =>
            prevTruckers.map((truck) =>
              truck.id === t.trucker?.id
                ? { ...truck, fuelCardBalance: truck.fuelCardBalance + t.escrow.fuelAmountUsd }
                : truck
            )
          );
        }

        const updatedMilestones = t.milestones.map((m) =>
          m.key === 'ARRIVED_AT_PICKUP'
            ? { ...m, completed: true }
            : m.key === 'ADVANCE_PAID_LOADED' && willBeBothApproved
            ? { ...m, current: true }
            : m
        );

        return {
          ...t,
          escrow: {
            ...t.escrow,
            shipperApproved: true,
            shipperApprovedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: newStatus,
            releasedAt: willBeBothApproved ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
          },
          milestones: updatedMilestones,
          messages: [
            ...t.messages,
            {
              id: `msg-${Date.now()}`,
              senderId: 'system',
              senderName: 'Smart Escrow Contract',
              senderRole: 'system',
              content: willBeBothApproved
                ? `⚡ MUTUAL CONSENT CONFIRMED! Dual signatures verified. $${t.escrow.fuelAmountUsd}.00 released directly to driver fuel card.`
                : 'Cargo Owner authorized fuel disbursement. Waiting for Driver mutual tap.',
              timestamp: 'Just now',
            },
          ],
        };
      })
    );
  };

  const handleTruckerApproveEscrow = () => {
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== activeTripId) return t;

        const willBeBothApproved = t.escrow.shipperApproved;
        const newStatus = willBeBothApproved ? 'RELEASED_TO_TRUCKER' : t.escrow.status;

        if (willBeBothApproved) {
          setTruckers((prevTruckers) =>
            prevTruckers.map((truck) =>
              truck.id === t.trucker?.id
                ? { ...truck, fuelCardBalance: truck.fuelCardBalance + t.escrow.fuelAmountUsd }
                : truck
            )
          );
        }

        const updatedMilestones = t.milestones.map((m) =>
          m.key === 'ARRIVED_AT_PICKUP'
            ? { ...m, completed: true }
            : m.key === 'ADVANCE_PAID_LOADED' && willBeBothApproved
            ? { ...m, current: true }
            : m
        );

        return {
          ...t,
          escrow: {
            ...t.escrow,
            truckerApproved: true,
            truckerApprovedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: newStatus,
            releasedAt: willBeBothApproved ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
          },
          milestones: updatedMilestones,
          messages: [
            ...t.messages,
            {
              id: `msg-${Date.now()}`,
              senderId: 'system',
              senderName: 'Smart Escrow Contract',
              senderRole: 'system',
              content: willBeBothApproved
                ? `⚡ MUTUAL CONSENT CONFIRMED! Dual signatures verified. $${t.escrow.fuelAmountUsd}.00 released directly to driver fuel card.`
                : 'Truck driver claimed arrival and verified fuel release terms.',
              timestamp: 'Just now',
            },
          ],
        };
      })
    );
  };

  // Condition 2: Auto-Refund of Diesel Deposit if truck absent after agreed hours (default 3 hrs)
  const handleTriggerAutoRefund = () => {
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== activeTripId) return t;
        const depositAmount = t.escrow.fuelAmountUsd;
        return {
          ...t,
          escrow: {
            ...t.escrow,
            status: 'REFUNDED_TO_SHIPPER',
            autoRefundStatus: 'REFUNDED_TO_OWNER',
            refundedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            refundReason: `Truck did not arrive at pick-up point within agreed ${t.escrow.autoRefundHours || 3} hours.`,
          },
          messages: [
            ...t.messages,
            {
              id: `msg-${Date.now()}`,
              senderId: 'system',
              senderName: 'Smart Escrow Contract',
              senderRole: 'system',
              content: `🛡️ AUTO-REFUND EXECUTED: $${depositAmount}.00 diesel security deposit has been returned to the goods owner because the truck was not at the pick-up point within the agreed ${t.escrow.autoRefundHours || 3}-hour grace window.`,
              timestamp: 'Just now',
            },
          ],
        };
      })
    );
  };

  // Condition 1: Toggle simulated driver location inside/outside pick-up geofence
  const handleToggleDriverAtPickup = () => {
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== activeTripId) return t;
        const nextAtPickup = !t.escrow.isDriverAtPickup;
        return {
          ...t,
          currentLocation: nextAtPickup
            ? { lat: t.origin.lat, lng: t.origin.lng }
            : { lat: t.origin.lat + 0.05, lng: t.origin.lng + 0.05 },
          escrow: {
            ...t.escrow,
            isDriverAtPickup: nextAtPickup,
            driverDistanceToPickupKm: nextAtPickup ? 0.08 : 8.4,
          },
        };
      })
    );
  };

  const handleUpdateAutoRefundHours = (hours: number) => {
    setTrips((prev) =>
      prev.map((t) =>
        t.id === activeTripId
          ? {
              ...t,
              escrow: {
                ...t.escrow,
                autoRefundHours: hours,
              },
            }
          : t
      )
    );
  };

  const handleResetEscrow = () => {
    setTrips((prev) =>
      prev.map((t) =>
        t.id === activeTripId
          ? {
              ...t,
              status: 'AT_PICKUP',
              escrow: {
                ...t.escrow,
                status: 'HELD_IN_ESCROW',
                shipperApproved: false,
                truckerApproved: false,
                autoRefundStatus: 'PENDING_ARRIVAL',
                cancellationRecord: undefined,
              },
            }
          : t
      )
    );
  };

  // Pre-Pickup Cancellation Option:
  // If driver cancels before pickup, shipper gets the full escrow pool.
  // If shipper cancels before pickup, driver gets the full escrow pool.
  const handleOpenCancelModal = (role: 'shipper' | 'driver') => {
    setCancelModalRole(role);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancelLoad = (reason: string) => {
    setIsCancelModalOpen(false);

    setTrips((prevTrips) =>
      prevTrips.map((t) => {
        if (t.id !== activeTripId) return t;

        const isShipperCancelling = cancelModalRole === 'shipper';
        const totalEscrowPool = t.escrow.totalEscrowLockedUsd || t.escrow.fuelAmountUsd * 2;
        const cancelledStatus = isShipperCancelling ? 'CANCELLED_BY_SHIPPER' : 'CANCELLED_BY_DRIVER';
        const escrowStatus = isShipperCancelling ? 'FORFEITED_TO_TRUCKER' : 'FORFEITED_TO_SHIPPER';
        const recipientRole: 'shipper' | 'driver' = isShipperCancelling ? 'driver' : 'shipper';

        // If shipper cancels, credit driver's wallet with the total escrow pool!
        if (isShipperCancelling && t.trucker?.id) {
          setTruckers((prev) =>
            prev.map((trk) =>
              trk.id === t.trucker?.id
                ? { ...trk, walletBalance: trk.walletBalance + totalEscrowPool }
                : trk
            )
          );
        }

        const updatedMilestones = t.milestones.map((m) =>
          m.current
            ? {
                ...m,
                current: false,
                description: `Cancelled before pickup (${isShipperCancelling ? 'By Goods Owner' : 'By Carrier'})`,
              }
            : m
        );

        return {
          ...t,
          status: cancelledStatus,
          milestones: updatedMilestones,
          escrow: {
            ...t.escrow,
            status: escrowStatus,
            driverBondStatus: isShipperCancelling ? 'AWARDED_TO_DRIVER' : 'AWARDED_TO_SHIPPER',
            cancellationRecord: {
              cancelledBy: cancelModalRole,
              cancelledAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              reason,
              payoutRecipient: recipientRole,
              totalPayoutUsd: totalEscrowPool,
            },
          },
          messages: [
            ...t.messages,
            {
              id: `msg-${Date.now()}`,
              senderId: 'system',
              senderName: 'Smart Escrow Contract',
              senderRole: 'system',
              content: isShipperCancelling
                ? `🚨 LOAD CANCELLED BEFORE PICKUP BY GOODS OWNER: Full combined escrow pool of $${totalEscrowPool}.00 (${formatCurrency(totalEscrowPool, appSettings.currency)}) transferred to Truck Driver as compensation for mobilization and deadhead capacity. Reason: "${reason}".`
                : `🚨 LOAD CANCELLED BEFORE PICKUP BY DRIVER: Driver forfeited matching commitment bond. Full combined escrow pool of $${totalEscrowPool}.00 (${formatCurrency(totalEscrowPool, appSettings.currency)}) transferred to Goods Owner as compensation for breach of load acceptance. Reason: "${reason}".`,
              timestamp: 'Just now',
            },
          ],
        };
      })
    );

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#ef4444', '#f59e0b', '#10b981'],
    });
  };

  // Phase 1 Advance Payment release
  const handleReleaseAdvance = () => {
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== activeTripId) return t;

        const advanceAmount = t.payments.advancePayment.amount;

        // Credit trucker wallet
        setTruckers((prevTruckers) =>
          prevTruckers.map((truck) =>
            truck.id === t.trucker?.id
              ? { ...truck, walletBalance: truck.walletBalance + advanceAmount }
              : truck
          )
        );

        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#10b981'],
        });

        const updatedMilestones = t.milestones.map((m) =>
          m.key === 'ADVANCE_PAID_LOADED'
            ? { ...m, completed: true, timestamp: 'Now' }
            : m.key === 'IN_TRANSIT'
            ? { ...m, current: true }
            : m
        );

        return {
          ...t,
          status: 'IN_TRANSIT',
          payments: {
            ...t.payments,
            advancePayment: {
              ...t.payments.advancePayment,
              status: 'RELEASED',
              paidAt: 'Now',
            },
          },
          milestones: updatedMilestones,
          messages: [
            ...t.messages,
            {
              id: `msg-${Date.now()}`,
              senderId: 'system',
              senderName: 'Payment Protocol',
              senderRole: 'system',
              content: `Phase 1 Advance Payment ($${advanceAmount}.00 net) released to ${t.trucker?.name}. Cargo loaded and secured.`,
              timestamp: 'Just now',
            },
          ],
        };
      })
    );
  };

  // Phase 1 Advance Payment Terms Update (Fillable by Goods Owner)
  const handleUpdateAdvanceTerms = (terms: {
    mode: 'percentage' | 'fixed_amount';
    grossAmount: number;
    netAmount: number;
    percentage: number;
    deductDiesel: boolean;
    dieselDeducted: number;
  }) => {
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== activeTripId) return t;

        const updatedFinalAmount = Math.max(0, t.payments.totalFreightCost - terms.grossAmount);
        const updatedFinalPercent = Math.max(0, 100 - terms.percentage);

        return {
          ...t,
          payments: {
            ...t.payments,
            advancePayment: {
              ...t.payments.advancePayment,
              mode: terms.mode,
              amount: terms.netAmount,
              percentage: terms.percentage,
              grossAmount: terms.grossAmount,
              dieselDeducted: terms.dieselDeducted,
              deductDiesel: terms.deductDiesel,
              status: 'PENDING_ACCEPTANCE',
              acceptedByTrucker: false,
              proposedBy: 'shipper',
            },
            finalPayment: {
              ...t.payments.finalPayment,
              amount: updatedFinalAmount,
              percentage: updatedFinalPercent,
            },
          },
          messages: [
            ...t.messages,
            {
              id: `msg-${Date.now()}`,
              senderId: 'system',
              senderName: 'Smart Escrow Contract',
              senderRole: 'system',
              content: terms.mode === 'fixed_amount'
                ? `📝 GOODS OWNER ADJUSTED ADVANCE: Fixed Gross Advance of $${terms.grossAmount}.00 proposed ($${terms.netAmount}.00 net minus $${terms.dieselDeducted}.00 first diesel). Awaiting driver acceptance.`
                : `📝 GOODS OWNER ADJUSTED ADVANCE: Phase 1 Advance proposed at ${terms.percentage}% of freight ($${terms.netAmount}.00 net, $${terms.grossAmount}.00 gross minus $${terms.dieselDeducted}.00 first diesel). Awaiting driver acceptance.`,
              timestamp: 'Just now',
            },
          ],
        };
      })
    );
  };

  // Trucker accepts Phase 1 Advance terms
  const handleTruckerAcceptAdvance = () => {
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== activeTripId) return t;

        const netAmount = t.payments.advancePayment.amount;

        return {
          ...t,
          payments: {
            ...t.payments,
            advancePayment: {
              ...t.payments.advancePayment,
              acceptedByTrucker: true,
              acceptedByTruckerAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: 'HELD_IN_ESCROW',
            },
          },
          messages: [
            ...t.messages,
            {
              id: `msg-${Date.now()}`,
              senderId: 'system',
              senderName: 'Smart Escrow Contract',
              senderRole: 'system',
              content: `🤝 CARRIER ACCEPTED TERMS: Driver ${t.trucker?.name || 'Carrier'} agreed to Phase 1 Advance terms ($${netAmount}.00 net loading payment).`,
              timestamp: 'Just now',
            },
          ],
        };
      })
    );
  };

  // Phase 2 Final Settlement release upon Proof of Delivery
  const handleConfirmDelivery = (pod: ProofOfDelivery) => {
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== activeTripId) return t;

        const finalAmount = t.payments.finalPayment.amount;

        // Credit trucker wallet
        setTruckers((prevTruckers) =>
          prevTruckers.map((truck) =>
            truck.id === t.trucker?.id
              ? { 
                  ...truck, 
                  walletBalance: truck.walletBalance + finalAmount,
                  tripsCompleted: truck.tripsCompleted + 1,
                }
              : truck
          )
        );

        const updatedMilestones = t.milestones.map((m) =>
          m.key === 'ARRIVED_DESTINATION' || m.key === 'INSPECTED_POD_FINAL_PAID'
            ? { ...m, completed: true, current: false, timestamp: 'Just now' }
            : m
        );

        return {
          ...t,
          status: 'COMPLETED',
          progressPercent: 100,
          proofOfDelivery: pod,
          payments: {
            ...t.payments,
            finalPayment: {
              ...t.payments.finalPayment,
              status: 'RELEASED',
              paidAt: 'Just now',
            },
          },
          milestones: updatedMilestones,
          messages: [
            ...t.messages,
            {
              id: `msg-${Date.now()}`,
              senderId: 'system',
              senderName: 'Settlement Protocol',
              senderRole: 'system',
              content: `Trip Completed! Proof of Delivery signed by ${pod.recipientName}. Phase 2 final settlement of $${finalAmount}.00 cleared.`,
              timestamp: 'Just now',
            },
          ],
        };
      })
    );

    // Prompt for rating after delivery confirmation
    setTimeout(() => {
      setIsReviewModalOpen(true);
    }, 700);
  };

  // Handle Review Submission
  const handleSubmitReview = (review: ReviewData) => {
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== activeTripId) return t;

        const updatedTrip = { ...t };
        if (review.reviewerRole === 'shipper') {
          updatedTrip.shipperReview = review;
        } else {
          updatedTrip.driverReview = review;
        }

        updatedTrip.messages = [
          ...updatedTrip.messages,
          {
            id: `msg-${Date.now()}`,
            senderId: 'system',
            senderName: 'Reputation Protocol',
            senderRole: 'system',
            content: `⭐ Verified ${review.rating}-Star Review submitted by ${review.reviewerName} (${review.reviewerRole === 'shipper' ? 'Cargo Owner' : 'Driver Carrier'})!`,
            timestamp: 'Just now',
          },
        ];

        return updatedTrip;
      })
    );

    // If review was for the trucker, update trucker's reputation state
    if (review.targetRole === 'trucker') {
      setTruckers((prevTruckers) =>
        prevTruckers.map((truck) => {
          if (truck.id === activeTrip.trucker?.id) {
            const existingReviews = truck.recentReviews || [];
            const newReviews = [review, ...existingReviews];
            return {
              ...truck,
              recentReviews: newReviews,
            };
          }
          return truck;
        })
      );
    }
  };

  const handleDriverArrivedAtPickup = () => {
    setTrips((prev) =>
      prev.map((t) => (t.id === activeTripId ? { ...t, status: 'AT_PICKUP' } : t))
    );
  };

  const handleDriverCargoLoaded = () => {
    setTrips((prev) =>
      prev.map((t) => (t.id === activeTripId ? { ...t, status: 'IN_TRANSIT' } : t))
    );
    setIsSimulating(true);
  };

  const handleDriverArrivedDestination = () => {
    setTrips((prev) =>
      prev.map((t) => (t.id === activeTripId ? { ...t, status: 'DELIVERED', progressPercent: 100 } : t))
    );
  };

  const handleSendMessage = (text: string) => {
    const newMsg = {
      id: `msg-${Date.now()}`,
      senderId: currentRole === 'shipper' ? activeTrip.shipperId : assignedTrucker.id,
      senderName: currentRole === 'shipper' ? activeTrip.shipperName.split(' ')[0] : assignedTrucker.name,
      senderRole: currentRole,
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setTrips((prev) =>
      prev.map((t) => (t.id === activeTripId ? { ...t, messages: [...t.messages, newMsg] } : t))
    );
  };

  const handleCreateTrip = (newTrip: Trip) => {
    setTrips((prev) => [newTrip, ...prev]);
    setActiveTripId(newTrip.id);
    simulationStepRef.current = 1;
    setIsSimulating(false);
  };

  // Gate 1: Not authenticated → show AuthScreen
  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!userProfile) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  // Gate 2: Authenticated + marketplace requested → show Marketplace
  if (showMarketplace) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="border-b border-slate-800 bg-slate-900/60 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">HaulFlow</span>
            <span className="text-xs text-slate-400">{userProfile.displayName}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowMarketplace(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition flex items-center gap-1.5"
            >
              Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-300 text-slate-400 text-sm font-medium transition flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
        <Marketplace
          profile={userProfile}
          trips={trips}
          truckers={truckers}
          currency={appSettings.currency}
          driverActiveTrips={trips.filter((t) => t.trucker?.id === assignedTrucker.id)}
          onSelectTrip={(trip, licenseScanUrl) => {
            setActiveTripId(trip.id);
            simulationStepRef.current = 1;
            setIsSimulating(false);
            setShowMarketplace(false);
          }}
          onSelectTrucker={(trucker) => {
            setActiveTripId(trips[0]?.id || INITIAL_TRIP.id);
            setShowMarketplace(false);
          }}
          onCreateLoad={() => {
            setShowMarketplace(false);
            setIsCreateModalOpen(true);
          }}
          onBack={() => setShowMarketplace(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Auth + Marketplace Bar */}
      <div className="bg-slate-900/80 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">
            {userProfile.displayName.charAt(0).toUpperCase()}
          </span>
          <span className="font-semibold text-white">{userProfile.displayName}</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">{userProfile.email}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowMarketplace(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition flex items-center gap-1.5"
          >
            <Store className="w-3.5 h-3.5" /> Marketplace
          </button>
          <button
            onClick={handleSignOut}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-300 text-slate-400 font-medium transition flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>

      {/* Top Navigation */}
      <Navbar
        currentRole={currentRole}
        onSelectRole={setCurrentRole}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        currency={appSettings.currency}
        activeTripsCount={trips.length}
        driverWalletBalance={assignedTrucker.walletBalance}
        driverFuelBalance={assignedTrucker.fuelCardBalance}
      />

      {/* Role Context Notification Bar */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-amber-500/20 text-amber-400">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
            <span className="text-slate-300">
              Viewing as <strong className="text-amber-400 font-bold uppercase">{currentRole === 'shipper' ? 'Cargo Owner (Shipper)' : 'Truck Driver (Carrier)'}</strong>.
              Switch roles anytime at the top bar to test dual-escrow mutual authorization & ratings!
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="text-amber-400 hover:text-amber-300 font-medium underline flex items-center gap-1 cursor-pointer"
            >
              Configure Profile & Payout Settings
            </button>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span>Trip Status:</span>
              <span className="font-bold text-white uppercase">{activeTrip.status}</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Escrow Security:</span>
              <span className="font-mono text-emerald-400 font-bold">
                {activeTrip.escrow.status === 'RELEASED_TO_TRUCKER' ? '2/2 SIGNED (RELEASED)' : `${(activeTrip.escrow.shipperApproved ? 1 : 0) + (activeTrip.escrow.truckerApproved ? 1 : 0)}/2 SIGNATURES`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentRole === 'shipper' ? (
          <ShipperDashboard
            activeTrip={activeTrip}
            allTrips={trips}
            settings={appSettings}
            currency={appSettings.currency}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onSelectTrip={(t) => {
              setActiveTripId(t.id);
              simulationStepRef.current = 1;
              setIsSimulating(false);
            }}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onOpenChat={() => setIsChatModalOpen(true)}
            onOpenPODModal={() => setIsPODModalOpen(true)}
            onOpenReviewModal={() => setIsReviewModalOpen(true)}
            onShipperApproveEscrow={handleShipperApproveEscrow}
            onTruckerApproveEscrow={handleTruckerApproveEscrow}
            onReleaseAdvance={handleReleaseAdvance}
            onReleaseFinal={() => setIsPODModalOpen(true)}
            onUpdateAdvanceTerms={handleUpdateAdvanceTerms}
            onTruckerAcceptAdvance={handleTruckerAcceptAdvance}
            onTriggerAutoRefund={handleTriggerAutoRefund}
            onToggleDriverAtPickup={handleToggleDriverAtPickup}
            onUpdateAutoRefundHours={handleUpdateAutoRefundHours}
            onResetEscrow={handleResetEscrow}
            onOpenCancelModal={() => handleOpenCancelModal('shipper')}
            onRepinPickup={(origin) => {
              setTrips((prev) =>
                prev.map((t) => {
                  if (t.id !== activeTripId) return t;
                  const truckerLoc = t.trucker?.currentLocation;
                  const newDeadheadKm = truckerLoc
                    ? calculateDistanceKm(truckerLoc.lat, truckerLoc.lng, origin.lat, origin.lng)
                    : t.escrow.deadheadDistanceKm;
                  const newDistKm = calculateDistanceKm(origin.lat, origin.lng, t.destination.lat, t.destination.lng);
                  const dieselPrice = getDieselPriceForCurrency(appSettings.currency.code);
                  const fuel = calculateFuelEscrowDeposit(newDeadheadKm, t.trucker?.truckType || 'box_truck', dieselPrice);
                  return {
                    ...t,
                    origin: { ...origin, isRemotelyPinned: true },
                    distanceKm: newDistKm,
                    distanceMiles: Math.round(newDistKm / 1.609),
                    escrow: {
                      ...t.escrow,
                      deadheadDistanceKm: newDeadheadKm,
                      deadheadDistanceMiles: Math.round(newDeadheadKm / 1.609),
                      driverDistanceToPickupKm: newDeadheadKm,
                      fuelAmountUsd: fuel.amount,
                      driverBondAmountUsd: fuel.amount,
                      totalEscrowLockedUsd: fuel.amount * 2,
                      dieselPricePerLiter: fuel.dieselPricePerLiter,
                      estimatedLiters: fuel.liters,
                    },
                  };
                })
              );
            }}
            onRepinDelivery={(destination) => {
              setTrips((prev) =>
                prev.map((t) => {
                  if (t.id !== activeTripId) return t;
                  const newDistKm = calculateDistanceKm(t.origin.lat, t.origin.lng, destination.lat, destination.lng);
                  return {
                    ...t,
                    destination: { ...destination, isRemotelyPinned: true },
                    distanceKm: newDistKm,
                    distanceMiles: Math.round(newDistKm / 1.609),
                  };
                })
              );
            }}
            isSimulating={isSimulating}
            onToggleSimulation={() => setIsSimulating(!isSimulating)}
            onResetSimulation={() => {
              simulationStepRef.current = 1;
              setTrips((prev) =>
                prev.map((t) =>
                  t.id === activeTripId
                    ? {
                        ...t,
                        progressPercent: 5,
                        currentLocation: { lat: t.origin.lat, lng: t.origin.lng },
                      }
                    : t
                )
              );
            }}
            speedMultiplier={speedMultiplier}
            onChangeSpeedMultiplier={setSpeedMultiplier}
          />
        ) : (
          <DriverDashboard
            activeTrip={activeTrip}
            trucker={assignedTrucker}
            settings={appSettings}
            currency={appSettings.currency}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onOpenChat={() => setIsChatModalOpen(true)}
            onOpenPODModal={() => setIsPODModalOpen(true)}
            onOpenReviewModal={() => setIsReviewModalOpen(true)}
            onShipperApproveEscrow={handleShipperApproveEscrow}
            onTruckerApproveEscrow={handleTruckerApproveEscrow}
            onDriverArrivedAtPickup={handleDriverArrivedAtPickup}
            onDriverCargoLoaded={handleDriverCargoLoaded}
            onDriverArrivedDestination={handleDriverArrivedDestination}
            onUpdateAdvanceTerms={handleUpdateAdvanceTerms}
            onTruckerAcceptAdvance={handleTruckerAcceptAdvance}
            onTriggerAutoRefund={handleTriggerAutoRefund}
            onToggleDriverAtPickup={handleToggleDriverAtPickup}
            onUpdateAutoRefundHours={handleUpdateAutoRefundHours}
            onResetEscrow={handleResetEscrow}
            onOpenCancelModal={() => handleOpenCancelModal('driver')}
            isSimulating={isSimulating}
            onToggleSimulation={() => setIsSimulating(!isSimulating)}
            onResetSimulation={() => {
              simulationStepRef.current = 1;
              setTrips((prev) =>
                prev.map((t) =>
                  t.id === activeTripId
                    ? {
                        ...t,
                        progressPercent: 5,
                        currentLocation: { lat: t.origin.lat, lng: t.origin.lng },
                      }
                    : t
                )
              );
            }}
            speedMultiplier={speedMultiplier}
            onChangeSpeedMultiplier={setSpeedMultiplier}
          />
        )}
      </main>

      {/* Modals */}
      <CreateCargoModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        availableTruckers={truckers}
        settings={appSettings}
        currency={appSettings.currency}
        onCreateTrip={handleCreateTrip}
      />

      <ChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        messages={activeTrip.messages}
        currentRole={currentRole}
        trucker={assignedTrucker}
        shipperName={activeTrip.shipperName}
        onSendMessage={handleSendMessage}
      />

      <ProofOfDeliveryModal
        isOpen={isPODModalOpen}
        onClose={() => setIsPODModalOpen(false)}
        finalAmount={activeTrip.payments.finalPayment.amount}
        driverName={assignedTrucker.name}
        currency={appSettings.currency}
        onConfirmDelivery={handleConfirmDelivery}
      />

      {/* Post-Delivery Rating & Review Modal */}
      <RatingReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        tripId={activeTrip.id}
        reviewerRole={currentRole}
        reviewerName={currentRole === 'shipper' ? activeTrip.shipperName : assignedTrucker.name}
        targetRole={currentRole === 'shipper' ? 'trucker' : 'shipper'}
        targetName={currentRole === 'shipper' ? assignedTrucker.name : activeTrip.shipperName}
        onSubmitReview={handleSubmitReview}
      />

      {/* Settings Modal (Goods Owner & Trucker company/personal, banking, TIN, VAT, currency) */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentRole={currentRole}
        settings={appSettings}
        onSaveSettings={handleSaveSettings}
      />

      {/* PWA Desktop & Android Install Modal */}
      <PWAInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Pre-Pickup Cancellation Modal with Dual Escrow Rules */}
      <CancelLoadModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        trip={activeTrip}
        cancelledBy={cancelModalRole}
        currency={appSettings.currency}
        onConfirmCancel={handleConfirmCancelLoad}
      />

      {/* Connectivity Status Indicator */}
      <OfflineIndicator />
    </div>
  );
}
