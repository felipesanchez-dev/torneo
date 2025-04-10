import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import Loading from '@/components/ui/loading';

interface Event {
  id: number;
  title: {
    rendered: string;
  };
  date: string;
  teams: number[];
  main_results?: string[];
  status?: string;
}

export default function VersusScreen() {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false); // Estado para controlar el refresco

  const router = useRouter();

  const fetchEvents = async () => {
    try {
      // Fetch events
      const eventsResponse = await fetch(
        "https://torneosfutbolbase.com/wp-json/sportspress/v2/events"
      );

      if (!eventsResponse.ok) {
        throw new Error(`API responded with status: ${eventsResponse.status}`);
      }

      const eventsData = await eventsResponse.json();

      if (!Array.isArray(eventsData) || eventsData.length === 0) {
        setError("No se pudieron cargar los partidos. Datos inválidos.");
        setLoading(false);
        return;
      }
      const events = eventsData
        .filter((event: Event) => {
          // Only filter out events without teams
          return event.teams && event.teams.length >= 2;
        })
        .sort((a: Event, b: Event) => {
          // Sort by date (closest first)
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        })
        .slice(0, 5); // Limit to 4 events

      setUpcomingEvents(events);
    } catch (error) {
      console.error("Error al obtener los eventos:", error);
      setError("Error al cargar los partidos. Intente nuevamente.");
    } finally {
      setLoading(false);
      setRefreshing(false); // Asegúrate de desactivar el estado de refresco
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const onRefresh = () => {
    setRefreshing(true); // Activa el estado de refresco
    fetchEvents(); // Vuelve a cargar los datos
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "";
    }
  };

  const getTeamNames = (title: string) => {
    const cleanTitle = title.replace(/<\/?[^>]+(>|$)/g, "");
    const parts = cleanTitle.split(/\s+[vV][sS]\s+/);

    if (parts.length === 2) {
      return {
        team1: parts[0].trim(),
        team2: parts[1].trim(),
      };
    }

    return {
      team1: cleanTitle,
      team2: "Oponente",
    };
  };

  const handleStartMatch = (event: Event) => {
    const teamNames = getTeamNames(event.title.rendered);

    const team1 = {
      id: event.teams[0],
      label: teamNames.team1,
    };

    const team2 = {
      id: event.teams[1],
      label: teamNames.team2,
    };

    router.push({
      pathname: "./game",
      params: {
        team1: encodeURIComponent(JSON.stringify(team1)),
        team2: encodeURIComponent(JSON.stringify(team2)),
        matchId: event.id,
      },
    });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={["#FFDE00", "#E53935"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.container}
      >
        <View style={styles.overlay}>
          <Image
            source={{
              uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo%20Musicalia%2025%20amarillo-aME4BgXjwjZeMhPGO4eQcFFjdodPcW.png",
            }}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Próximos Partidos</Text>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#FFDE00"]} // Color del indicador de refresco
                tintColor="#FFDE00" // Color del indicador de refresco
              />
            }
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <Loading />
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : upcomingEvents.length === 0 ? (
              <View style={styles.noMatchesContainer}>
                <Text style={styles.noMatchesText}>
                  No hay partidos programados
                </Text>
              </View>
            ) : (
              upcomingEvents.map((event) => {
                const teamNames = getTeamNames(event.title.rendered);

                return (
                  <LinearGradient
                    key={event.id}
                    colors={["#FFFFFF", "#F9F9F9"]}
                    style={styles.matchCard}
                  >
                    <View style={styles.matchContent}>
                      <View style={styles.dateTimeContainer}>
                        <Text style={styles.dateTime}>
                          {formatDate(event.date)} - {formatTime(event.date)}
                        </Text>
                      </View>

                      <View style={styles.matchDetails}>
                        <View style={styles.teamRow}>
                          <View style={styles.teamBadge}>
                            <Text style={styles.teamInitial}>
                              {teamNames.team1.charAt(0)}
                            </Text>
                          </View>
                          <View style={styles.teamNameContainer}>
                            <Text
                              style={styles.teamName}
                              adjustsFontSizeToFit={true}
                              minimumFontScale={0.7}
                            >
                              {teamNames.team1}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.vsRow}>
                          <View style={styles.vsContainer}>
                            <Text style={styles.vsText}>VS</Text>
                          </View>
                        </View>

                        <View style={styles.teamRow}>
                          <View style={styles.teamBadge}>
                            <Text style={styles.teamInitial}>
                              {teamNames.team2.charAt(0)}
                            </Text>
                          </View>
                          <View style={styles.teamNameContainer}>
                            <Text
                              style={styles.teamName}
                              adjustsFontSizeToFit={true}
                              minimumFontScale={0.7}
                            >
                              {teamNames.team2}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    {event.main_results &&
                      event.main_results.length === 2 &&
                      event.main_results[0] !== "" &&
                      event.main_results[1] !== "" && (
                        <View style={styles.scoreContainer}>
                          <Text style={styles.scoreLabel}>MARCADOR</Text>
                          <Text style={styles.scoreText}>
                            {event.main_results[0]} - {event.main_results[1]}
                          </Text>
                        </View>
                      )}

                    <TouchableOpacity
                      style={styles.startButton}
                      onPress={() => handleStartMatch(event)}
                    >
                      <Text style={styles.startButtonText}>Abir partido</Text>
                    </TouchableOpacity>
                  </LinearGradient>
                );
              })
            )}
          </ScrollView>
        </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 40,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  logo: {
    width: 200,
    height: 130,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
    textShadowColor: "rgba(255, 255, 255, 0.76)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  scrollView: {
    width: "100%",
    maxHeight: "70%",
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  matchCard: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 20,
    marginBottom: 20,
    paddingVertical: 20,
    paddingHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
  },
  matchContent: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
  dateTimeContainer: {
    backgroundColor: "#FFDE00",
    borderRadius: 15,
    paddingVertical: 8,
    paddingHorizontal: 15,
    alignSelf: "center",
    marginBottom: 15,
  },
  dateTime: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
    textAlign: "center",
  },
  matchDetails: {
    width: "100%",
    marginTop: 10,
    alignItems: "center",
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 10,
    padding: 6,
  },
  teamBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E53935",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#FFDE00",
  },
  teamInitial: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 18,
  },
  teamNameContainer: {
    flex: 1,
  },
  teamName: {
    textAlign: "center",
    marginRight: 50,
    fontSize: 25,
    fontWeight: "600",
    color: "#222",
  },
  vsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 8,
  },
  vsContainer: {
    backgroundColor: "#E53935",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFDE00",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
    marginHorizontal: 6,
  },
  vsText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
  },
  scoreContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.08)",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 15,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
    textAlign: "center",
  },
  scoreText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222",
    textAlign: "center",
    marginTop: 5,
  },
  startButton: {
    marginTop: 20,
    backgroundColor: "#009B3A",
    paddingVertical: 16,
    width: "100%",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  startButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    marginTop: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#222",
    textAlign: "center",
  },
  noMatchesContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    marginTop: 20,
  },
  noMatchesText: {
    fontSize: 16,
    color: "#222",
    textAlign: "center",
  },
  errorContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#E53935",
    textAlign: "center",
  },
});