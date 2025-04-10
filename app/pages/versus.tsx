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
      const eventsResponse = await fetch('https://luxoradevs.com/jp/wp-json/sportspress/v2/events');
      
      if (!eventsResponse.ok) {
        throw new Error(`API responded with status: ${eventsResponse.status}`);
      }
      
      const eventsData = await eventsResponse.json();
      
      if (!Array.isArray(eventsData) || eventsData.length === 0) {
        setError('No se pudieron cargar los partidos. Datos inválidos.');
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
      console.error('Error al obtener los eventos:', error);
      setError('Error al cargar los partidos. Intente nuevamente.');
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
      return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return '';
    }
  };

  const getTeamNames = (title: string) => {
    const cleanTitle = title.replace(/<\/?[^>]+(>|$)/g, "");
    const parts = cleanTitle.split(/\s+[vV][sS]\s+/);
    
    if (parts.length === 2) {
      return {
        team1: parts[0].trim(),
        team2: parts[1].trim()
      };
    }
    
    return {
      team1: cleanTitle,
      team2: "Oponente"
    };
  };

  const handleStartMatch = (event: Event) => {
    const teamNames = getTeamNames(event.title.rendered);
    
    const team1 = {
      id: event.teams[0],
      label: teamNames.team1
    };
    
    const team2 = {
      id: event.teams[1],
      label: teamNames.team2
    };
    
    router.push({
      pathname: './game',
      params: { 
        team1: encodeURIComponent(JSON.stringify(team1)), 
        team2: encodeURIComponent(JSON.stringify(team2)),
        matchId: event.id
      }
    });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient 
        colors={['#FFDE00', '#E53935']} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 0, y: 1 }} 
        style={styles.container}
      >
        <View style={styles.overlay}>
          <Image 
            source={{ uri: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo%20Musicalia%2025%20amarillo-aME4BgXjwjZeMhPGO4eQcFFjdodPcW.png' }} 
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
                colors={['#FFDE00']} // Color del indicador de refresco
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
                <Text style={styles.noMatchesText}>No hay partidos programados</Text>
              </View>
            ) : (
              upcomingEvents.map((event) => {
                const teamNames = getTeamNames(event.title.rendered);
                
                return (
                  <LinearGradient
                    key={event.id}
                    colors={['#FFFFFF', '#F9F9F9']}
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
                            <Text style={styles.teamName} adjustsFontSizeToFit={true} minimumFontScale={0.7}>
                              {teamNames.team1}
                            </Text>
                          </View>
                        </View>
                        
                        <View style={styles.vsRow}>
                          <View style={styles.vsContainer}>
                            <Text style={styles.vsText}>VS</Text>
                          </View>
                          {event.main_results && event.main_results.length === 2 && 
                           event.main_results[0] !== "" && event.main_results[1] !== "" && (
                            <View style={styles.scoreContainer}>
                              <Text style={styles.scoreText}>
                                {event.main_results[0]} - {event.main_results[1]}
                              </Text>
                            </View>
                          )}
                        </View>
                        
                        <View style={styles.teamRow}>
                          <View style={styles.teamBadge}>
                            <Text style={styles.teamInitial}>
                              {teamNames.team2.charAt(0)}
                            </Text>
                          </View>
                          <View style={styles.teamNameContainer}>
                            <Text style={styles.teamName} adjustsFontSizeToFit={true} minimumFontScale={0.7}>
                              {teamNames.team2}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.startButton}
                      onPress={() => handleStartMatch(event)}
                    >
                      <Text style={styles.startButtonText}>Abrir</Text>
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
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  logo: {
    width: 180,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  scrollView: {
    width: '100%',
    maxHeight: '70%',
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  matchCard: {
    flexDirection: 'row',
    borderRadius: 15,
    marginBottom: 15,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.15)"}
      : {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      }
    )
  },
  matchContent: {
    flex: 1,
    marginRight: 10,
  },
  dateTimeContainer: {
    backgroundColor: '#FFDE00',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  dateTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#222222',
  },
  matchDetails: {
    width: '100%',
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 10,
    padding: 5,
  },
  teamBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#FFDE00',
  },
  teamInitial: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  teamNameContainer: {
    flex: 1,
    paddingRight: 5,
  },
  teamName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222222',
  },
  vsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
  },
  vsContainer: {
    backgroundColor: '#E53935',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFDE00',
  },
  vsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scoreContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginLeft: 10,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
  },
  startButton: {
    backgroundColor: '#009B3A', // Green from the logo
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  startButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#222222',
    textAlign: 'center',
  },
  noMatchesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  noMatchesText: {
    fontSize: 16,
    color: '#222222',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#E53935',
    textAlign: 'center',
  },
});