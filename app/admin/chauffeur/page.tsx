"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Clock, MapPin, User, Bell, Navigation, CheckCircle, Search, Filter, TrendingUp, Calendar, DollarSign, Activity, LogOut } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Header from "@/components/Header";
import { toast } from "react-hot-toast";
import { DriverLiveRidePanel } from "@/components/booking/DriverLiveRidePanel";

interface Booking {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  departureAddress: string;
  destinationAddress: string;
  date: string;
  timeSlot: string;
  status: string;
  distance: number;
  price: number;
  notes?: string;
  driverNotified: boolean;
  customerNotified: boolean;
  tripStarted: boolean;
}

export default function ChauffeurDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [completedBookings, setCompletedBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [activeTab, setActiveTab] = useState<"upcoming" | "history" | "stats">("upcoming");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    fetchBookings();

    // Poll for new bookings so driver portal updates shortly after a client confirms
    const pollInterval = setInterval(() => {
      fetchBookings();
    }, 5000); // every 5 seconds
    
    // Request notification permission
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === "default") {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
        });
      }
    }

    // Check for upcoming bookings every minute
    const upcomingInterval = setInterval(() => {
      checkUpcomingBookings();
    }, 60000); // Every minute

    return () => {
      clearInterval(pollInterval);
      clearInterval(upcomingInterval);
    };
  }, []);

  const fetchBookings = async () => {
    try {
      console.log("Fetching bookings...");
      const response = await fetch("/api/admin/bookings");
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error(errorData.error || "Failed to fetch bookings");
      }
      
      const data = await response.json();
      console.log("Bookings data received:", data.bookings?.length || 0, "bookings");
      
      // Store all bookings
      setAllBookings(data.bookings || []);

      // Include both PENDING and CONFIRMED in upcoming bookings so drivers can confirm
      const upcomingBookings = (data.bookings || [])
        .filter((b: Booking) => b.status === "PENDING" || b.status === "CONFIRMED")
        .sort((a: Booking, b: Booking) => {
          const dateA = new Date(`${a.date}T${a.timeSlot.split("-")[0]}`);
          const dateB = new Date(`${b.date}T${b.timeSlot.split("-")[0]}`);
          return dateA.getTime() - dateB.getTime();
        });

      // Filter completed bookings
      const completed = (data.bookings || [])
        .filter((b: Booking) => b.status === "COMPLETED")
        .sort((a: Booking, b: Booking) => {
          const dateA = new Date(`${a.date}T${a.timeSlot.split("-")[0]}`);
          const dateB = new Date(`${b.date}T${b.timeSlot.split("-")[0]}`);
          return dateB.getTime() - dateA.getTime(); // Most recent first
        });

      console.log("Upcoming bookings:", upcomingBookings.length);
      console.log("Completed bookings:", completed.length);

      setBookings(upcomingBookings);
      setCompletedBookings(completed);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Erreur lors du chargement des réservations");
    } finally {
      setIsLoading(false);
    }
  };

  const checkUpcomingBookings = () => {
    const now = new Date();
    
    bookings.forEach(booking => {
      const bookingDateTime = new Date(`${booking.date}T${booking.timeSlot.split("-")[0]}`);
      const timeUntilBooking = bookingDateTime.getTime() - now.getTime();
      const oneHour = 60 * 60 * 1000;
      
      // Notify 1 hour before (within a 2-minute window to avoid multiple notifications)
      if (timeUntilBooking > 0 && timeUntilBooking <= oneHour && timeUntilBooking > (oneHour - 120000)) {
        sendNotification(booking);
      }
    });
  };

  const sendNotification = (booking: Booking) => {
    if (notificationPermission === "granted") {
      new Notification("Réservation dans 1 heure", {
        body: `${booking.firstName} ${booking.lastName} - ${booking.departureAddress}`,
        icon: "/icon-192x192.png",
        tag: booking.id, // Prevent duplicate notifications
      });
    }
  };

  const calculateTimeRemaining = (date: string, timeSlot: string) => {
    const bookingDateTime = new Date(`${date}T${timeSlot.split("-")[0]}`);
    const now = new Date();
    const diff = bookingDateTime.getTime() - now.getTime();
    
    if (diff < 0) {
      return { text: "Passé", color: "text-red-500", urgent: false };
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours < 1) {
      return { 
        text: `${minutes} min`, 
        color: "text-red-500 font-bold", 
        urgent: true 
      };
    } else if (hours < 24) {
      return { 
        text: `${hours}h ${minutes}min`, 
        color: "text-orange-500 font-semibold", 
        urgent: false 
      };
    } else {
      const days = Math.floor(hours / 24);
      return { 
        text: `${days}j ${hours % 24}h`, 
        color: "text-gray-400", 
        urgent: false 
      };
    }
  };

  const openWazeToPickup = async (booking: Booking) => {
    // Format address for Waze URL
    const address = encodeURIComponent(booking.departureAddress);
    const wazeUrl = `https://waze.com/ul?q=${address}&navigate=yes`;
    
    // Notify customer that driver is en route
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}/notify-enroute`, {
        method: "POST",
      });
      
      if (response.ok) {
        toast.success("Le client a été notifié que vous êtes en route");
        setBookings(bookings.map(b => 
          b.id === booking.id 
            ? { ...b, driverNotified: true, customerNotified: true }
            : b
        ));
      }
    } catch (error) {
      console.error("Error notifying customer:", error);
    }
    
    // Open Waze
    window.open(wazeUrl, "_blank");
  };

  const confirmBooking = async (booking: Booking) => {
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}/confirm`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Erreur lors de la confirmation");

      const data = await response.json();
      // Update local state
      setBookings(bookings.map(b => b.id === booking.id ? { ...b, status: 'CONFIRMED' } : b));
      toast.success("Réservation confirmée");
    } catch (error) {
      console.error("Error confirming booking:", error);
      toast.error("Impossible de confirmer la réservation");
    }
  };

  const startTrip = async (booking: Booking) => {
    // Format destination for Waze
    const destination = encodeURIComponent(booking.destinationAddress);
    const wazeUrl = `https://waze.com/ul?q=${destination}&navigate=yes`;
    
    // Mark trip as started
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}/start-trip`, {
        method: "POST",
      });
      
      if (response.ok) {
        toast.success("Trajet démarré");
        setBookings(bookings.map(b => 
          b.id === booking.id 
            ? { ...b, tripStarted: true }
            : b
        ));
      }
    } catch (error) {
      console.error("Error starting trip:", error);
    }
    
    // Open Waze to destination
    window.open(wazeUrl, "_blank");
  };

  // Filter bookings based on search and date
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = searchQuery === "" || 
      `${booking.firstName} ${booking.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.departureAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.destinationAddress.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDate = filterDate === "" || booking.date === filterDate;
    
    return matchesSearch && matchesDate;
  });

  // Calculate statistics
  const calculateStats = () => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const todayBookings = completedBookings.filter(b => b.date === today);
    const weekBookings = completedBookings.filter(b => b.date >= weekAgo);
    const monthBookings = completedBookings.filter(b => b.date >= monthAgo);

    const todayRevenue = todayBookings.reduce((sum, b) => sum + b.price, 0);
    const weekRevenue = weekBookings.reduce((sum, b) => sum + b.price, 0);
    const monthRevenue = monthBookings.reduce((sum, b) => sum + b.price, 0);

    const totalDistance = completedBookings.reduce((sum, b) => sum + b.distance, 0);
    const totalRevenue = completedBookings.reduce((sum, b) => sum + b.price, 0);

    return {
      totalTrips: completedBookings.length,
      todayTrips: todayBookings.length,
      weekTrips: weekBookings.length,
      monthTrips: monthBookings.length,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      totalRevenue,
      totalDistance,
      averagePrice: completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0,
    };
  };

  const stats = calculateStats();

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark">
      <Header />
      <DriverLiveRidePanel />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Tableau de bord chauffeur</h1>
              <p className="text-gray-400">
                {bookings.length} réservation{bookings.length > 1 ? "s" : ""} confirmée{bookings.length > 1 ? "s" : ""}
              </p>
            </div>
            
            {notificationPermission !== "granted" && (
              <Button
                variant="outline"
                onClick={() => {
                  if ("Notification" in window) {
                    Notification.requestPermission().then(permission => {
                      setNotificationPermission(permission);
                      if (permission === "granted") {
                        toast.success("Notifications activées");
                      }
                    });
                  }
                }}
              >
                <Bell className="w-4 h-4 mr-2" />
                Activer les notifications
              </Button>
            )}
          </div>

          {/* Tabs Navigation */}
          <div className="flex gap-2 mb-6 border-b border-dark-gray">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "upcoming"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              À venir ({filteredBookings.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "history"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Historique ({completedBookings.length})
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "stats"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Statistiques
            </button>
          </div>

          {/* Filters for upcoming bookings */}
          {activeTab === "upcoming" && (
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou adresse..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-dark-lighter border border-dark-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="relative md:w-64">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-dark-lighter border border-dark-gray rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {(searchQuery || filterDate) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterDate("");
                  }}
                >
                  Réinitialiser
                </Button>
              )}
            </div>
          )}

          {/* Upcoming Bookings Tab */}
          {activeTab === "upcoming" && (
            <>
              {filteredBookings.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Aucune réservation</h3>
                <p className="text-gray-400">
                  {searchQuery || filterDate
                    ? "Aucune réservation ne correspond à vos filtres"
                    : "Les réservations confirmées apparaîtront ici"}
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => {
                const timeRemaining = calculateTimeRemaining(booking.date, booking.timeSlot);
                const bookingDate = new Date(booking.date);
                
                return (
                  <Card key={booking.id} className={timeRemaining.urgent ? "border-2 border-red-500" : ""}>
                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                      {/* Client Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <User className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                          <div>
                            <h3 className="text-xl font-semibold">
                              {booking.firstName} {booking.lastName}
                            </h3>
                            <p className="text-gray-400 text-sm">{booking.phoneNumber}</p>
                            {booking.email && (
                              <p className="text-gray-400 text-sm">{booking.email}</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 ml-8">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500">Départ</p>
                              <p className="text-sm">{booking.departureAddress}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500">Arrivée</p>
                              <p className="text-sm">{booking.destinationAddress}</p>
                            </div>
                          </div>
                        </div>

                        {booking.notes && (
                          <div className="mt-3 ml-8 p-3 bg-dark-lighter rounded-lg">
                            <p className="text-sm text-gray-300">
                              <span className="font-medium">Note:</span> {booking.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Date/Time & Actions */}
                      <div className="lg:w-80 space-y-4">
                        <div className="bg-dark-lighter p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-5 h-5 text-primary" />
                            <span className="font-semibold">
                              {bookingDate.toLocaleDateString("fr-FR", { 
                                weekday: "long", 
                                day: "numeric", 
                                month: "long" 
                              })}
                            </span>
                          </div>
                          <p className="text-2xl font-bold mb-2">
                            {booking.timeSlot}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Temps restant:</span>
                            <span className={`text-lg ${timeRemaining.color}`}>
                              {timeRemaining.text}
                            </span>
                          </div>
                          <div className="mt-2 pt-2 border-t border-dark-gray">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Distance:</span>
                              <span className="font-medium">{booking.distance.toFixed(1)} km</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Prix:</span>
                              <span className="font-medium">{booking.price.toFixed(2)} €</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2">
                          {booking.status === "PENDING" ? (
                            <Button
                              onClick={() => confirmBooking(booking)}
                              className="w-full bg-yellow-600 hover:bg-yellow-700"
                              size="lg"
                            >
                              <Navigation className="w-5 h-5 mr-2" />
                              Confirmer la réservation
                            </Button>
                          ) : !booking.driverNotified ? (
                            <Button
                              onClick={() => openWazeToPickup(booking)}
                              className="w-full"
                              size="lg"
                            >
                              <Navigation className="w-5 h-5 mr-2" />
                              Aller chercher le client
                            </Button>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 text-green-500 text-sm mb-2">
                                <CheckCircle className="w-4 h-4" />
                                <span>Client notifié - En route</span>
                              </div>
                              {!booking.tripStarted ? (
                                <Button
                                  onClick={() => startTrip(booking)}
                                  className="w-full bg-green-600 hover:bg-green-700"
                                  size="lg"
                                >
                                  <Navigation className="w-5 h-5 mr-2" />
                                  Départ du trajet
                                </Button>
                              ) : (
                                <div className="flex items-center gap-2 text-blue-500 text-sm">
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Trajet en cours</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
            </>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <div className="space-y-4">
              {completedBookings.length === 0 ? (
                <Card>
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Aucun trajet complété</h3>
                    <p className="text-gray-400">Votre historique de trajets apparaîtra ici</p>
                  </div>
                </Card>
              ) : (
                completedBookings.map((booking) => {
                  const bookingDate = new Date(booking.date);
                  
                  return (
                    <Card key={booking.id}>
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <h3 className="text-xl font-semibold">
                              {booking.firstName} {booking.lastName}
                            </h3>
                            <span className="text-sm text-gray-400">
                              {bookingDate.toLocaleDateString("fr-FR")} · {booking.timeSlot}
                            </span>
                          </div>
                          
                          <div className="space-y-1 ml-8 text-sm">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-blue-500" />
                              <span className="text-gray-400">{booking.departureAddress}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-green-500" />
                              <span className="text-gray-400">{booking.destinationAddress}</span>
                            </div>
                          </div>
                        </div>

                        <div className="lg:w-64 bg-dark-lighter p-4 rounded-lg">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-400">Distance</p>
                              <p className="text-lg font-semibold">{booking.distance.toFixed(1)} km</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Revenu</p>
                              <p className="text-lg font-semibold text-green-500">{booking.price.toFixed(2)} €</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === "stats" && (
            <div className="space-y-6">
              {/* Revenue Cards */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Today */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-blue-600/10 via-blue-600/5 to-transparent border-blue-500/20 hover:border-blue-500/40 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <Activity className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xs text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">Aujourd'hui</span>
                    </div>
                    <p className="text-4xl font-bold text-white mb-1">{stats.todayRevenue.toFixed(2)} €</p>
                    <p className="text-sm text-gray-400">{stats.todayTrips} course{stats.todayTrips > 1 ? "s" : ""} réalisée{stats.todayTrips > 1 ? "s" : ""}</p>
                  </div>
                </Card>

                {/* Week */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-green-600/10 via-green-600/5 to-transparent border-green-500/20 hover:border-green-500/40 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xs text-green-400 bg-green-500/10 px-3 py-1 rounded-full">Cette semaine</span>
                    </div>
                    <p className="text-4xl font-bold text-white mb-1">{stats.weekRevenue.toFixed(2)} €</p>
                    <p className="text-sm text-gray-400">{stats.weekTrips} course{stats.weekTrips > 1 ? "s" : ""} réalisée{stats.weekTrips > 1 ? "s" : ""}</p>
                  </div>
                </Card>

                {/* Month */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-purple-600/10 via-purple-600/5 to-transparent border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xs text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full">Ce mois</span>
                    </div>
                    <p className="text-4xl font-bold text-white mb-1">{stats.monthRevenue.toFixed(2)} €</p>
                    <p className="text-sm text-gray-400">{stats.monthTrips} course{stats.monthTrips > 1 ? "s" : ""} réalisée{stats.monthTrips > 1 ? "s" : ""}</p>
                  </div>
                </Card>
              </div>

              {/* Overall Stats */}
              <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950">
                <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-yellow-500" />
                  Statistiques globales
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="group text-center p-6 bg-zinc-800/50 hover:bg-zinc-800 rounded-2xl border border-zinc-700/50 hover:border-zinc-600 transition-all duration-300">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
                      <Navigation className="w-7 h-7 text-white" />
                    </div>
                    <p className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">{stats.totalTrips}</p>
                    <p className="text-sm text-gray-400 font-medium">Courses réalisées</p>
                  </div>

                  <div className="group text-center p-6 bg-zinc-800/50 hover:bg-zinc-800 rounded-2xl border border-zinc-700/50 hover:border-zinc-600 transition-all duration-300">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform">
                      <DollarSign className="w-7 h-7 text-white" />
                    </div>
                    <p className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">{stats.totalRevenue.toFixed(0)} €</p>
                    <p className="text-sm text-gray-400 font-medium">Revenu total</p>
                  </div>

                  <div className="group text-center p-6 bg-zinc-800/50 hover:bg-zinc-800 rounded-2xl border border-zinc-700/50 hover:border-zinc-600 transition-all duration-300">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                      <MapPin className="w-7 h-7 text-white" />
                    </div>
                    <p className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">{stats.totalDistance.toFixed(0)} km</p>
                    <p className="text-sm text-gray-400 font-medium">Distance parcourue</p>
                  </div>

                  <div className="group text-center p-6 bg-zinc-800/50 hover:bg-zinc-800 rounded-2xl border border-zinc-700/50 hover:border-zinc-600 transition-all duration-300">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-500/20 group-hover:scale-110 transition-transform">
                      <DollarSign className="w-7 h-7 text-white" />
                    </div>
                    <p className="text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent">{stats.averagePrice.toFixed(2)} €</p>
                    <p className="text-sm text-gray-400 font-medium">Prix moyen</p>
                  </div>
                </div>
              </Card>

              {/* Performance Insights */}
              <Card>
                <h3 className="text-2xl font-semibold mb-4">Aperçu de performance</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-dark-lighter rounded-lg">
                    <div>
                      <p className="font-semibold">Taux d'activité hebdomadaire</p>
                      <p className="text-sm text-gray-400">Basé sur les 7 derniers jours</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-500">
                        {stats.weekTrips > 0 ? ((stats.weekTrips / 7) * 100).toFixed(0) : 0}%
                      </p>
                      <p className="text-xs text-gray-500">{(stats.weekTrips / 7).toFixed(1)} trajets/jour</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-dark-lighter rounded-lg">
                    <div>
                      <p className="font-semibold">Revenu moyen par jour actif</p>
                      <p className="text-sm text-gray-400">Sur la base des trajets complétés</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {stats.weekTrips > 0 ? (stats.weekRevenue / Math.ceil(stats.weekTrips / 2)).toFixed(2) : 0} €
                      </p>
                    </div>
                  </div>

                  {stats.totalTrips > 0 && (
                    <div className="flex justify-between items-center p-4 bg-dark-lighter rounded-lg">
                      <div>
                        <p className="font-semibold">Distance moyenne par trajet</p>
                        <p className="text-sm text-gray-400">Efficacité des trajets</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-500">
                          {(stats.totalDistance / stats.totalTrips).toFixed(1)} km
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
