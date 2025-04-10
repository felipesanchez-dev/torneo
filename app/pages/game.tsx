"use client"
import { useState, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native"
// import { Shield, Clock, Trophy, AlertTriangle } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons"
import { Stack, useLocalSearchParams } from "expo-router"
import GoalModal from "../../components/ModalGol"
import YellowCardModal from "../../components/ModalAmarilla"
import RedCardModal from "../../components/ModalRoja"
import BlueCardModal from "../../components/ModalAzul"
import { LinearGradient } from "expo-linear-gradient"
import Entypo from '@expo/vector-icons/Entypo';
import EditEventModal from "../../components/EditEventModal";
import Cronometro from "../../components/Cronometro";

// Theme colors based on the logo and screenshots
const theme = {
  primary: "#FFDE00", // Yellow
  secondary: "#000000", // Black
  accent1: "#E30613", // Red
  accent2: "#009640", // Green
  accent3: "#0066CC", // Blue
  background: "#F5F5F5",
  cardBackground: "#FFFFFF",
  textPrimary: "#000000",
  textSecondary: "#666666",
  border: "#EEEEEE",
};

type Team = {
  id: number;
  label: string;
};

type Player = {
  id: number;
  label: string;
};

interface MatchStats {
  goals: {
    local: number;
    visitante: number;
  };
  cards: {
    local: {
      amarilla: number;
      roja: number;
      azul: number;
    };
    visitante: {
      amarilla: number;
      roja: number;
      azul: number;
    };
  };
}

// Define una interfaz para los eventos
interface MatchEvent {
  id: number;
  type: "gol" | "tarjeta";
  cardType?: "amarilla" | "roja" | "azul";
  player: string;
  playerId?: number;
  team: "local" | "visitante";
  minute: number;
  assistant?: string;
}

export default function GameScreen() {
  const authUsername = "admin";
  const authPassword = "g9wX YDBx p5vR jQ9i z5aa 9b5i";
  // State for active tab
  const [activeTab, setActiveTab] = useState<"eventos" | "estadisticas">(
    "eventos"
  );
  const [refreshing, setRefreshing] = useState(false);

  const { team1, team2, matchId } = useLocalSearchParams();

  const parsedTeam1 =
    typeof team1 === "string" ? JSON.parse(decodeURIComponent(team1)) : null;
  const parsedTeam2 =
    typeof team2 === "string" ? JSON.parse(decodeURIComponent(team2)) : null;
  const parsedMatchId = typeof matchId === "string" ? matchId : "2092"; // Valor por defecto

  // Modal visibility states
  const [modalVisible, setModalVisible] = useState(false);
  const [yellowCardModalVisible, setYellowCardModalVisible] = useState(false);
  const [redCardModalVisible, setRedCardModalVisible] = useState(false);
  const [blueCardModalVisible, setBlueCardModalVisible] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  //Editar Goles
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<MatchEvent | null>(null);

  const handleEditEvent = (event: MatchEvent) => {
    setEventToEdit(event);
    setEditModalVisible(true);
    // console.log("Edit event clicked", event)
  };

  // Match data
  const [matchData, setMatchData] = useState({
    localTeam: parsedTeam1?.label || "Equipo Local",
    visitorTeam: parsedTeam2?.label || "Equipo Visitante",
    localScore: 0,
    visitorScore: 0,
    localTeamId: 0,
    visitorTeamId: 0,
    date: "",
    league: "",
    season: "",
    yellowCards: {
      local: 0,
      visitante: 0,
    },
    redCards: {
      local: 0,
      visitante: 0,
    },
    blueCards: {
      local: 0,
      visitante: 0,
    },
  });

  // Events data
  const [events, setEvents] = useState<MatchEvent[]>([]);

  // Player data mapping
  const [playerMap, setPlayerMap] = useState<Record<number, string>>({});

  // Add a new state variable for events loading
  const [eventsLoading, setEventsLoading] = useState(false);

  // Helper function to extract minutes from formatted string
  const extractMinutesFromString = (formattedString: string): number[] => {
    // Check if the string has the format "X (Y', Z')"
    const match = formattedString.match(/\d+\s*$$(.*)$$/);
    if (match && match[1]) {
      // Extract the minutes from the parentheses
      return match[1]
        .split(", ")
        .map((m) => Number.parseInt(m.replace("'", "")));
    }
    return [];
  };

  // Function to fetch match data from API
  const fetchMatchData = async () => {
    try {
      setLoading(true);
      setEventsLoading(true); // Set events loading to true
      const response = await fetch(
        `https://luxoradevs.com/jp/wp-json/sportspress/v2/events/${parsedMatchId}`
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      // Process the data
      const teams = data.teams;
      const localTeamId = teams[0];
      const visitorTeamId = teams[1];

      // Format match data
      setMatchData({
        localTeam: parsedTeam1?.label || `Equipo ${localTeamId}`,
        visitorTeam: parsedTeam2?.label || `Equipo ${visitorTeamId}`,
        localTeamId: localTeamId,
        visitorTeamId: visitorTeamId,
        localScore: Number.parseInt(data.results[localTeamId]?.goals || 0),
        visitorScore: Number.parseInt(data.results[visitorTeamId]?.goals || 0),
        date: new Date(data.date).toLocaleDateString(),
        league: data.leagues && data.leagues.length > 0 ? data.leagues[0] : "",
        season: data.seasons && data.seasons.length > 0 ? data.seasons[0] : "",
        yellowCards: {
          local: Number.parseInt(
            data.performance[localTeamId]?.[0]?.yellowcards || 0
          ),
          visitante: Number.parseInt(
            data.performance[visitorTeamId]?.[0]?.yellowcards || 0
          ),
        },
        redCards: {
          local: Number.parseInt(
            data.performance[localTeamId]?.[0]?.redcards || 0
          ),
          visitante: Number.parseInt(
            data.performance[visitorTeamId]?.[0]?.redcards || 0
          ),
        },
        blueCards: {
          local: Number.parseInt(data.performance[localTeamId]?.[0]?.azul || 0),
          visitante: Number.parseInt(
            data.performance[visitorTeamId]?.[0]?.azul || 0
          ),
        },
      });

      // Collect player IDs only for players who have participated in events
      const activePlayerIds: Set<number> = new Set();

      // Check for players with goals, assists, or cards in local team
      if (data.performance && data.performance[localTeamId]) {
        Object.entries(data.performance[localTeamId]).forEach(
          ([playerId, playerData]: [string, any]) => {
            if (playerId === "0") return; // Skip metadata

            const hasGoals = playerData.goals && playerData.goals.trim() !== "";
            const hasAssists =
              playerData.assists && Number.parseInt(playerData.assists) > 0;
            const hasYellowCards =
              playerData.yellowcards && playerData.yellowcards.trim() !== "";
            const hasRedCards =
              playerData.redcards && playerData.redcards.trim() !== "";
            const hasBlueCards =
              playerData.azul && Number.parseInt(playerData.azul) > 0;

            if (
              hasGoals ||
              hasAssists ||
              hasYellowCards ||
              hasRedCards ||
              hasBlueCards
            ) {
              activePlayerIds.add(Number.parseInt(playerId));
            }
          }
        );
      }

      // Check for players with goals, assists, or cards in visitor team
      if (data.performance && data.performance[visitorTeamId]) {
        Object.entries(data.performance[visitorTeamId]).forEach(
          ([playerId, playerData]: [string, any]) => {
            if (playerId === "0") return; // Skip metadata

            const hasGoals = playerData.goals && playerData.goals.trim() !== "";
            const hasAssists =
              playerData.assists && Number.parseInt(playerData.assists) > 0;
            const hasYellowCards =
              playerData.yellowcards && playerData.yellowcards.trim() !== "";
            const hasRedCards =
              playerData.redcards && playerData.redcards.trim() !== "";
            const hasBlueCards =
              playerData.azul && Number.parseInt(playerData.azul) > 0;

            if (
              hasGoals ||
              hasAssists ||
              hasYellowCards ||
              hasRedCards ||
              hasBlueCards
            ) {
              activePlayerIds.add(Number.parseInt(playerId));
            }
          }
        );
      }

      // Fetch player data only for active players
      const playerMapping: Record<number, string> = {};

      for (const playerId of activePlayerIds) {
        try {
          const playerResponse = await fetch(
            `https://luxoradevs.com/jp/wp-json/sportspress/v2/players/${playerId}`
          );
          if (playerResponse.ok) {
            const playerData = await playerResponse.json();
            if (playerData.title && playerData.title.rendered) {
              playerMapping[playerId] = playerData.title.rendered;
            } else {
              playerMapping[playerId] = `Jugador ${playerId}`;
            }
          } else {
            playerMapping[playerId] = `Jugador ${playerId}`;
          }
        } catch (error) {
          console.error(`Error fetching player ${playerId}:`, error);
          playerMapping[playerId] = `Jugador ${playerId}`;
        }
      }

      setPlayerMap(playerMapping);

      // Process events from performance data
      const newEvents: MatchEvent[] = [];
      let eventId = 1;

      // Process goals with minutes
      // For local team
      if (data.performance && data.performance[localTeamId]) {
        Object.entries(data.performance[localTeamId]).forEach(
          ([playerId, playerData]: [string, any]) => {
            if (
              playerId !== "0" &&
              playerData.goals &&
              playerData.goals.trim() !== ""
            ) {
              const playerName =
                playerMapping[Number.parseInt(playerId)] ||
                `Jugador ${playerId}`;

              // Extract goal count and minutes
              const goalsMatch = playerData.goals.match(
                /^(\d+)(?:\s*\((.*?)\))?$/
              );
              if (goalsMatch) {
                const goalCount = Number.parseInt(goalsMatch[1]) || 0;
                const minutesString = goalsMatch[2] || "";

                // Get minutes as an array
                const minutes = minutesString
                  ? minutesString
                      .split(", ")
                      .map((m: string) => Number.parseInt(m.replace("'", "")))
                  : [];
                // Add a goal event for each minute
                for (let i = 0; i < minutes.length; i++) {
                  newEvents.push({
                    id: eventId++,
                    type: "gol",
                    player: playerName,
                    playerId: Number.parseInt(playerId),
                    team: "local",
                    minute: minutes[i] || 0,
                  });
                }
              } else {
                // Fallback for old format - just add one goal with a random minute
                const goalCount = Number.parseInt(playerData.goals) || 0;
                for (let i = 0; i < goalCount; i++) {
                  newEvents.push({
                    id: eventId++,
                    type: "gol",
                    player: playerName,
                    playerId: Number.parseInt(playerId),
                    team: "local",
                    minute: Math.floor(Math.random() * 90) + 1, // Random minute as fallback
                  });
                }
              }
            }
          }
        );
      }

      // For visitor team
      if (data.performance && data.performance[visitorTeamId]) {
        Object.entries(data.performance[visitorTeamId]).forEach(
          ([playerId, playerData]: [string, any]) => {
            if (
              playerId !== "0" &&
              playerData.goals &&
              playerData.goals.trim() !== ""
            ) {
              const playerName =
                playerMapping[Number.parseInt(playerId)] ||
                `Jugador ${playerId}`;

              // Extract goal count and minutes
              const goalsMatch = playerData.goals.match(
                /^(\d+)(?:\s*\((.*?)\))?$/
              );
              if (goalsMatch) {
                const goalCount = Number.parseInt(goalsMatch[1]) || 0;
                const minutesString = goalsMatch[2] || "";

                // Get minutes as an array
                const minutes = minutesString
                  ? minutesString
                      .split(", ")
                      .map((m: string) => Number.parseInt(m.replace("'", "")))
                  : [];

                // Add a goal event for each minute
                for (let i = 0; i < minutes.length; i++) {
                  newEvents.push({
                    id: eventId++,
                    type: "gol",
                    player: playerName,
                    playerId: Number.parseInt(playerId),
                    team: "visitante",
                    minute: minutes[i] || 0,
                  });
                }
              } else {
                // Fallback for old format - just add one goal with a random minute
                const goalCount = Number.parseInt(playerData.goals) || 0;
                for (let i = 0; i < goalCount; i++) {
                  newEvents.push({
                    id: eventId++,
                    type: "gol",
                    player: playerName,
                    playerId: Number.parseInt(playerId),
                    team: "visitante",
                    minute: Math.floor(Math.random() * 90) + 1, // Random minute as fallback
                  });
                }
              }
            }
          }
        );
      }

      // Process assists and match them with goals
      // For local team
      if (data.performance && data.performance[localTeamId]) {
        Object.entries(data.performance[localTeamId]).forEach(
          ([playerId, playerData]: [string, any]) => {
            if (
              playerId !== "0" &&
              playerData.assists &&
              Number.parseInt(playerData.assists) > 0
            ) {
              const playerName =
                playerMapping[Number.parseInt(playerId)] ||
                `Jugador ${playerId}`;

              // Assign assists to goals
              for (let i = 0; i < Number.parseInt(playerData.assists); i++) {
                // Find a goal without an assistant
                const goalWithoutAssist = newEvents.find(
                  (event) =>
                    event.type === "gol" &&
                    !event.assistant &&
                    event.playerId !== Number.parseInt(playerId)
                );

                if (goalWithoutAssist) {
                  goalWithoutAssist.assistant = playerName;
                }
              }
            }
          }
        );
      }

      // For visitor team
      if (data.performance && data.performance[visitorTeamId]) {
        Object.entries(data.performance[visitorTeamId]).forEach(
          ([playerId, playerData]: [string, any]) => {
            if (
              playerId !== "0" &&
              playerData.assists &&
              Number.parseInt(playerData.assists) > 0
            ) {
              const playerName =
                playerMapping[Number.parseInt(playerId)] ||
                `Jugador ${playerId}`;

              // Assign assists to goals
              for (let i = 0; i < Number.parseInt(playerData.assists); i++) {
                // Find a goal without an assistant
                const goalWithoutAssist = newEvents.find(
                  (event) =>
                    event.type === "gol" &&
                    !event.assistant &&
                    event.playerId !== Number.parseInt(playerId)
                );

                if (goalWithoutAssist) {
                  goalWithoutAssist.assistant = playerName;
                }
              }
            }
          }
        );
      }

      // Process yellow cards with minutes
      // For local team
      if (data.performance && data.performance[localTeamId]) {
        Object.entries(data.performance[localTeamId]).forEach(
          ([playerId, playerData]: [string, any]) => {
            if (
              playerId !== "0" &&
              playerData.yellowcards &&
              playerData.yellowcards.trim() !== ""
            ) {
              const playerName =
                playerMapping[Number.parseInt(playerId)] ||
                `Jugador ${playerId}`;

              // Extract card count and minutes
              const cardsMatch = playerData.yellowcards.match(
                /^(\d+)(?:\s*\((.*?)\))?$/
              );
              if (cardsMatch) {
                const cardCount = Number.parseInt(cardsMatch[1]) || 0;
                const minutesString = cardsMatch[2] || "";

                // Get minutes as an array
                const minutes = minutesString
                  ? minutesString
                      .split(", ")
                      .map((m: string) => Number.parseInt(m.replace("'", "")))
                  : [];

                // Add a card event for each minute
                for (let i = 0; i < minutes.length; i++) {
                  newEvents.push({
                    id: eventId++,
                    type: "tarjeta",
                    cardType: "amarilla",
                    player: playerName,
                    playerId: Number.parseInt(playerId),
                    team: "local",
                    minute: minutes[i] || 0,
                  });
                }
              } else {
                // Fallback for old format
                const cardCount = Number.parseInt(playerData.yellowcards) || 0;
                for (let i = 0; i < cardCount; i++) {
                  newEvents.push({
                    id: eventId++,
                    type: "tarjeta",
                    cardType: "amarilla",
                    player: playerName,
                    playerId: Number.parseInt(playerId),
                    team: "local",
                    minute: Math.floor(Math.random() * 90) + 1, // Random minute as fallback
                  });
                }
              }
            }
          }
        );
      }

      // For visitor team
      if (data.performance && data.performance[visitorTeamId]) {
        Object.entries(data.performance[visitorTeamId]).forEach(
          ([playerId, playerData]: [string, any]) => {
            if (
              playerId !== "0" &&
              playerData.yellowcards &&
              playerData.yellowcards.trim() !== ""
            ) {
              const playerName =
                playerMapping[Number.parseInt(playerId)] ||
                `Jugador ${playerId}`;

              // Extract card count and minutes
              const cardsMatch = playerData.yellowcards.match(
                /^(\d+)(?:\s*\((.*?)\))?$/
              );
              if (cardsMatch) {
                const cardCount = Number.parseInt(cardsMatch[1]) || 0;
                const minutesString = cardsMatch[2] || "";

                // Get minutes as an array
                const minutes = minutesString
                  ? minutesString
                      .split(", ")
                      .map((m: string) => Number.parseInt(m.replace("'", "")))
                  : [];

                // Add a card event for each minute
                for (let i = 0; i < minutes.length; i++) {
                  newEvents.push({
                    id: eventId++,
                    type: "tarjeta",
                    cardType: "amarilla",
                    player: playerName,
                    playerId: Number.parseInt(playerId),
                    team: "visitante",
                    minute: minutes[i] || 0,
                  });
                }
              } else {
                // Fallback for old format
                const cardCount = Number.parseInt(playerData.yellowcards) || 0;
                for (let i = 0; i < cardCount; i++) {
                  newEvents.push({
                    id: eventId++,
                    type: "tarjeta",
                    cardType: "amarilla",
                    player: playerName,
                    playerId: Number.parseInt(playerId),
                    team: "visitante",
                    minute: Math.floor(Math.random() * 90) + 1, // Random minute as fallback
                  });
                }
              }
            }
          }
        );
      }

      // Process red cards with minutes
      // For local team
      if (data.performance && data.performance[localTeamId]) {
        Object.entries(data.performance[localTeamId]).forEach(
          ([playerId, playerData]: [string, any]) => {
            if (
              playerId !== "0" &&
              playerData.redcards &&
              playerData.redcards.trim() !== ""
            ) {
              const playerName =
                playerMapping[Number.parseInt(playerId)] ||
                `Jugador ${playerId}`;

              // Extract card count and minutes
              const cardsMatch = playerData.redcards.match(
                /^(\d+)(?:\s*\((.*?)\))?$/
              );
              if (cardsMatch) {
                const cardCount = Number.parseInt(cardsMatch[1]) || 0;
                const minutesString = cardsMatch[2] || "";

                // Get minutes as an array
                const minutes = minutesString
                  ? minutesString
                      .split(", ")
                      .map((m: string) => Number.parseInt(m.replace("'", "")))
                  : [];

                // Add a card event for each minute
                for (let i = 0; i < minutes.length; i++) {
                  newEvents.push({
                    id: eventId++,
                    type: "tarjeta",
                    cardType: "roja",
                    player: playerName,
                    playerId: Number.parseInt(playerId),
                    team: "local",
                    minute: minutes[i] || 0,
                  });
                }
              } else {
                // Fallback for old format
                const cardCount = Number.parseInt(playerData.redcards) || 0;
                for (let i = 0; i < cardCount; i++) {
                  newEvents.push({
                    id: eventId++,
                    type: "tarjeta",
                    cardType: "roja",
                    player: playerName,
                    playerId: Number.parseInt(playerId),
                    team: "local",
                    minute: Math.floor(Math.random() * 90) + 1, // Random minute as fallback
                  });
                }
              }
            }
          }
        );
      }

      // For visitor team
      if (data.performance && data.performance[visitorTeamId]) {
        Object.entries(data.performance[visitorTeamId]).forEach(
          ([playerId, playerData]: [string, any]) => {
            if (
              playerId !== "0" &&
              playerData.redcards &&
              playerData.redcards.trim() !== ""
            ) {
              const playerName =
                playerMapping[Number.parseInt(playerId)] ||
                `Jugador ${playerId}`;

              // Extract card count and minutes
              const cardsMatch = playerData.redcards.match(
                /^(\d+)(?:\s*\((.*?)\))?$/
              );
              if (cardsMatch) {
                const cardCount = Number.parseInt(cardsMatch[1]) || 0;
                const minutesString = cardsMatch[2] || "";

                // Get minutes as an array
                const minutes = minutesString
                  ? minutesString
                      .split(", ")
                      .map((m: string) => Number.parseInt(m.replace("'", "")))
                  : [];

                // Add a card event for each minute
                for (let i = 0; i < minutes.length; i++) {
                  newEvents.push({
                    id: eventId++,
                    type: "tarjeta",
                    cardType: "roja",
                    player: playerName,
                    playerId: Number.parseInt(playerId),
                    team: "visitante",
                    minute: minutes[i] || 0,
                  });
                }
              } else {
                // Fallback for old format
                const cardCount = Number.parseInt(playerData.redcards) || 0;
                for (let i = 0; i < cardCount; i++) {
                  newEvents.push({
                    id: eventId++,
                    type: "tarjeta",
                    cardType: "roja",
                    player: playerName,
                    playerId: Number.parseInt(playerId),
                    team: "visitante",
                    minute: Math.floor(Math.random() * 90) + 1, // Random minute as fallback
                  });
                }
              }
            }
          }
        );
      }

      // Process blue cards
      // For local team
      if (data.performance && data.performance[localTeamId]) {
        Object.entries(data.performance[localTeamId]).forEach(
          ([playerId, playerData]: [string, any]) => {
            if (
              playerId !== "0" &&
              playerData.azul &&
              Number.parseInt(playerData.azul) > 0
            ) {
              const playerName =
                playerMapping[Number.parseInt(playerId)] ||
                `Jugador ${playerId}`;

              const cardsMatch = playerData.azul.match(
                /^(\d+)(?:\s*\((.*?)\))?$/
              );
              if (cardsMatch) {
                const cardCount = Number.parseInt(cardsMatch[1]) || 0;
                const minutesString = cardsMatch[2] || "";

                // Get minutes as an array
                const minutes = minutesString
                  ? minutesString
                      .split(", ")
                      .map((m: string) => Number.parseInt(m.replace("'", "")))
                  : [];

                // Add a card event for each minute
                for (let i = 0; i < minutes.length; i++) {
                  newEvents.push({
                    id: eventId++,
                    type: "tarjeta",
                    cardType: "azul",
                    player: playerName,
                    playerId: Number.parseInt(playerId),
                    team: "visitante",
                    minute: minutes[i] || 0,
                  });
                }
              } else {
                // Fallback for old format
                const cardCount = Number.parseInt(playerData.azul) || 0;
                for (let i = 0; i < cardCount; i++) {
                  newEvents.push({
                    id: eventId++,
                    type: "tarjeta",
                    cardType: "azul",
                    player: playerName,
                    playerId: Number.parseInt(playerId),
                    team: "visitante",
                    minute: Math.floor(Math.random() * 90) + 1, // Random minute as fallback
                  });
                }
              }
            }
          }
        );
      }

      // For visitor team
      if (data.performance && data.performance[visitorTeamId]) {
        Object.entries(data.performance[visitorTeamId]).forEach(
          ([playerId, playerData]: [string, any]) => {
            if (
              playerId !== "0" &&
              playerData.azul &&
              Number.parseInt(playerData.azul) > 0
            ) {
              const playerName =
                playerMapping[Number.parseInt(playerId)] ||
                `Jugador ${playerId}`;

              const cardsMatch = playerData.azul.match(
                /^(\d+)(?:\s*\((.*?)\))?$/
              );
              if (cardsMatch) {
                const cardCount = Number.parseInt(cardsMatch[1]) || 0;
                const minutesString = cardsMatch[2] || "";

                // Get minutes as an array
                const minutes = minutesString
                  ? minutesString
                      .split(", ")
                      .map((m: string) => Number.parseInt(m.replace("'", "")))
                  : [];

                // Add a card event for each minute
                for (let i = 0; i < minutes.length; i++) {
                  newEvents.push({
                    id: eventId++,
                    type: "tarjeta",
                    cardType: "azul",
                    player: playerName,
                    playerId: Number.parseInt(playerId),
                    team: "visitante",
                    minute: minutes[i] || 0,
                  });
                }
              } else {
                // Fallback for old format
                const cardCount = Number.parseInt(playerData.azul) || 0;
                for (let i = 0; i < cardCount; i++) {
                  newEvents.push({
                    id: eventId++,
                    type: "tarjeta",
                    cardType: "azul",
                    player: playerName,
                    playerId: Number.parseInt(playerId),
                    team: "visitante",
                    minute: Math.floor(Math.random() * 90) + 1, // Random minute as fallback
                  });
                }
              }
            }
          }
        );
      }

      // Sort events by minute
      newEvents.sort((a, b) => a.minute - b.minute);
      setEvents(newEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      console.error("Error fetching match data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false); // Ensure refreshing state is reset
      setEventsLoading(false); // Set events loading to false
    }
  };

  // Initial data load
  useEffect(() => {
    fetchMatchData();
  }, [parsedMatchId]);

  // Handle pull-to-refresh
  const onRefresh = () => {
    setActiveTab("eventos");
    setRefreshing(true);
    fetchMatchData();
  };

  // Calculate stats from events
  const calculateStats = (): MatchStats => {
    const stats: MatchStats = {
      goals: { local: matchData.localScore, visitante: matchData.visitorScore },
      cards: {
        local: {
          amarilla: matchData.yellowCards.local,
          roja: matchData.redCards.local,
          azul: matchData.blueCards.local,
        },
        visitante: {
          amarilla: matchData.yellowCards.visitante,
          roja: matchData.redCards.visitante,
          azul: matchData.blueCards.visitante,
        },
      },
    };

    return stats;
  };

  const stats = calculateStats();

  // Add new event handlers
  const handleAddGoal = (
    team: Team,
    player: Player,
    assistant: Player | null,
    minute: number
  ) => {
    // Create a new goal event
    const newEvent: MatchEvent = {
      id: events.length + 1,
      type: "gol",
      player: player.label,
      team: team.id === parsedTeam1?.id ? "local" : "visitante",
      minute: minute,
      assistant: assistant?.label,
    };

    // Update events and match data
    setEvents([...events, newEvent]);

    // Update score
    if (team.id === parsedTeam1?.id) {
      setMatchData({
        ...matchData,
        localScore: matchData.localScore + 1,
      });
    } else {
      setMatchData({
        ...matchData,
        visitorScore: matchData.visitorScore + 1,
      });
    }
  };

  const handleAddYellowCard = (
    team: Team,
    player: Player,
    cardMinute: number
  ) => {
    // Create a new yellow card event
    const newEvent: MatchEvent = {
      id: events.length + 1,
      type: "tarjeta",
      cardType: "amarilla",
      player: player.label,
      team: team.id === parsedTeam1?.id ? "local" : "visitante",
      minute: cardMinute,
    };

    // Update events and match data
    setEvents([...events, newEvent]);

    // Update yellow card count
    if (team.id === parsedTeam1?.id) {
      setMatchData({
        ...matchData,
        yellowCards: {
          ...matchData.yellowCards,
          local: matchData.yellowCards.local + 1,
        },
      });
    } else {
      setMatchData({
        ...matchData,
        yellowCards: {
          ...matchData.yellowCards,
          visitante: matchData.yellowCards.visitante + 1,
        },
      });
    }
  };

  const handleAddRedCard = (team: Team, player: Player, cardMinute: number) => {
    // Create a new red card event
    const newEvent: MatchEvent = {
      id: events.length + 1,
      type: "tarjeta",
      cardType: "roja",
      player: player.label,
      team: team.id === parsedTeam1?.id ? "local" : "visitante",
      minute: cardMinute,
    };

    // Update events and match data
    setEvents([...events, newEvent]);

    // Update red card count
    if (team.id === parsedTeam1?.id) {
      setMatchData({
        ...matchData,
        redCards: {
          ...matchData.redCards,
          local: matchData.redCards.local + 1,
        },
      });
    } else {
      setMatchData({
        ...matchData,
        redCards: {
          ...matchData.redCards,
          visitante: matchData.redCards.visitante + 1,
        },
      });
    }
  };

  const handleAddBlueCard = (
    team: Team,
    player: Player,
    cardMinute: number
  ) => {
    // Create a new blue card event
    const newEvent: MatchEvent = {
      id: events.length + 1,
      type: "tarjeta",
      cardType: "azul",
      player: player.label,
      team: team.id === parsedTeam1?.id ? "local" : "visitante",
      minute: cardMinute,
    };

    // Update events and match data
    setEvents([...events, newEvent]);

    // Update blue card count
    if (team.id === parsedTeam1?.id) {
      setMatchData({
        ...matchData,
        blueCards: {
          ...matchData.blueCards,
          local: matchData.blueCards.local + 1,
        },
      });
    } else {
      setMatchData({
        ...matchData,
        blueCards: {
          ...matchData.blueCards,
          visitante: matchData.blueCards.visitante + 1,
        },
      });
    }
  };

  const handleDeleteEvent = (
    eventId: any,
    type: string,
    cardType: any,
    team: string,
    event: any
  ) => {
    setEvents((prevEvents) => prevEvents.filter((e) => e.id !== eventId));

    const teamId = team === "local" ? parsedTeam1?.id : parsedTeam2?.id;

    if (type === "gol") {
      const isLocal = team === "local";
      const currentScore = isLocal
        ? matchData.localScore
        : matchData.visitorScore;
      const updatedScore = Math.max(currentScore - 1, 0);

      // Actualizar el marcador del equipo en el estado
      setMatchData((prev) => ({
        ...prev,
        [isLocal ? "localScore" : "visitorScore"]: updatedScore,
      }));

      const teamId = isLocal ? parsedTeam1.id : parsedTeam2.id;
      const playerId = event.playerId?.toString() || "0";
      const playerGoals = Number(event.goals) || 1;
      const updatedPlayerGoals = Math.max(playerGoals - 1, 0);

      const body = {
        results: {
          [teamId.toString()]: {
            goals: updatedScore,
          },
        },
        performance: {
          [teamId.toString()]: {
            meta: {
              goals: updatedScore,
            },
            [playerId]: {
              goals: updatedPlayerGoals,
            },
          },
        },
      };

      updateResponse(body);
    }

    //----------------Funcionalidad de eliminar tarjetas (No funciona ERROR DE API)---------------//
    if (type === "tarjeta") {
      const isLocal = team === "local";
      const playerId = event.playerId?.toString() || "0";
      const teamKey = isLocal
        ? parsedTeam1?.id?.toString() || ""
        : parsedTeam2?.id?.toString() || "";

      if (cardType === "amarilla") {
        const currentScore = isLocal
          ? matchData.yellowCards.local
          : matchData.yellowCards.visitante;
        const newScore = Math.max(currentScore - 1, 0);

        setMatchData((prev) => ({
          ...prev,
          yellowCards: {
            ...prev.yellowCards,
            [isLocal ? "local" : "visitante"]: newScore,
          },
        }));

        const body = {
          performance: {
            [teamKey]: {
              [playerId]: { yellowcards: newScore },
              meta: { yellowcards: newScore },
            },
          },
        };
        updateResponse(body);
      }

      if (cardType === "roja") {
        const currentScore = isLocal
          ? matchData.redCards.local
          : matchData.redCards.visitante;
        const newScore = Math.max(currentScore - 1, 0);

        setMatchData((prev) => ({
          ...prev,
          redCards: {
            ...prev.redCards,
            [isLocal ? "local" : "visitante"]: newScore,
          },
        }));

        const body = {
          performance: {
            [teamKey]: {
              [playerId]: { redcards: newScore },
              meta: { redcards: newScore },
            },
          },
        };
        updateResponse(body);
      }

      if (cardType === "azul") {
        const currentScore = isLocal
          ? matchData.blueCards.local
          : matchData.blueCards.visitante;
        const newScore = Math.max(currentScore - 1, 0);

        setMatchData((prev) => ({
          ...prev,
          blueCards: {
            ...prev.blueCards,
            [isLocal ? "local" : "visitante"]: newScore,
          },
        }));

        const body = {
          performance: {
            [teamKey]: {
              [playerId]: { azul: newScore },
              meta: { azul: newScore },
            },
          },
        };
        updateResponse(body);
      }
    }
    //-------------------------------------------------------------------------------------//
  };

  const updateResponse = async (body: any) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://luxoradevs.com/jp/wp-json/sportspress/v2/events/${matchId}`,
        {
          method: "POST",
          headers: {
            Authorization: "Basic " + btoa(`${authUsername}:${authPassword}`),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setTimeout(() => {
        onRefresh();
      }, 2000);
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar el partido.", [
        { text: "OK" },
      ]);
    } finally {
      setLoading(false);
      return false;
    }
  };

  if (loading && !refreshing) {
    return (
      <LinearGradient
        colors={["#FFDE00", "#E53935"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientContainer}
      >
        <SafeAreaView style={[styles.safeArea, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={[styles.loadingText, { color: "#FFFFFF" }]}>
            Cargando datos del partido...
          </Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient
        colors={["#FFDE00", "#E53935"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientContainer}
      >
        <SafeAreaView style={[styles.safeArea, styles.errorContainer]}>
          {/* <AlertTriangle size={48} color="#FFFFFF" /> */}
          <Text style={[styles.errorText, { color: "#FFFFFF" }]}>
            Error al cargar los datos
          </Text>
          <Text style={[styles.errorDetail, { color: "#FFFFFF" }]}>
            {error}
          </Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={["#FFDE00", "#E53935"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientContainer}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={styles.scrollViewContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.primary]}
                tintColor={theme.primary}
                title="Actualizando..."
                titleColor={theme.textSecondary}
              />
            }
          >
              <View style={styles.wrapper}>
                <Cronometro />
              </View>


            {/* Match Score */}
            <View style={styles.scoreCard}>
              <Text style={styles.matchDate}>{matchData.date}</Text>
              <Text style={styles.scoreHeader}>
                {matchData.localTeam}{" "}
                <Text style={styles.scoreText}>
                  {matchData.localScore} - {matchData.visitorScore}
                </Text>{" "}
                {matchData.visitorTeam}
              </Text>

              {/* Action Buttons */}
              <View style={styles.actionButtonsContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.actionButtons}
                >
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setModalVisible(true)}
                  >
                    <Ionicons
                      name="trophy"
                      size={18}
                      color={theme.textPrimary}
                    />
                    <Text style={styles.actionButtonText}>Gol</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: theme.primary },
                    ]}
                    onPress={() => setYellowCardModalVisible(true)}
                  >
                    <Ionicons
                      name="shield-outline"
                      size={18}
                      color={theme.textPrimary}
                    />
                    <Text style={styles.actionButtonText}>Amarilla</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: "#FFCCCB" },
                    ]}
                    onPress={() => setRedCardModalVisible(true)}
                  >
                    <Ionicons
                      name="shield-outline"
                      size={18}
                      color={theme.accent1}
                    />
                    <Text style={styles.actionButtonText}>Roja</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: "#CCE5FF" },
                    ]}
                    onPress={() => setBlueCardModalVisible(true)}
                  >
                    <Ionicons
                      name="shield-outline"
                      size={18}
                      color={theme.accent3}
                    />
                    <Text style={styles.actionButtonText}>Azul</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === "eventos" && styles.activeTabButton,
                ]}
                onPress={() => setActiveTab("eventos")}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    activeTab === "eventos" && styles.activeTabButtonText,
                  ]}
                >
                  Eventos
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === "estadisticas" && styles.activeTabButton,
                ]}
                onPress={() => setActiveTab("estadisticas")}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    activeTab === "estadisticas" && styles.activeTabButtonText,
                  ]}
                >
                  Estadísticas
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content based on active tab */}
            {activeTab === "eventos" ? (
              <View
                style={[
                  styles.contentCard,
                  events.length === 0 && styles.emptyContentCard,
                ]}
              >
                <Text style={styles.contentTitle}>Cronología del Partido</Text>

                {eventsLoading ? (
                  <View style={styles.eventsLoadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={styles.eventsLoadingText}>
                      Cargando eventos...
                    </Text>
                  </View>
                ) : events.length === 0 ? (
                  <View style={styles.emptyStateContainer}>
                    <Text style={styles.noEventsText}>
                      No hay eventos registrados para este partido
                    </Text>
                  </View>
                ) : (
                  events.map((event) => (
                    <View key={event.id} style={styles.eventItem}>
                      <View style={styles.eventIconContainer}>
                        {event.type === "gol" ? (
                          <Ionicons
                            name="trophy-outline"
                            size={20}
                            color={theme.textPrimary}
                          />
                        ) : (
                          <Ionicons
                            name="shield-outline"
                            size={20}
                            color={
                              event.cardType === "amarilla"
                                ? theme.primary
                                : event.cardType === "roja"
                                ? theme.accent1
                                : event.cardType === "azul"
                                ? theme.accent3
                                : theme.textSecondary
                            }
                          />
                        )}
                      </View>

                      <View style={styles.eventContent}>
                        <Text style={styles.eventTitle}>
                          {event.type === "gol" ? "Gol" : ` ${event.cardType}`}
                        </Text>
                        <Text style={styles.eventPlayer}>
                          {event.player} (
                          {event.team === "local"
                            ? matchData.localTeam
                            : matchData.visitorTeam}
                          )
                          {event.type === "gol" && event.assistant && (
                            <Text style={styles.eventAssistant}>
                              {" "}
                              - Asistencia: {event.assistant}
                            </Text>
                          )}
                        </Text>
                      </View>

                      <View style={styles.eventTimeContainer}>
                        <Ionicons
                          name="time-outline"
                          size={16}
                          color={theme.textSecondary}
                        />
                        <Text style={styles.eventTime}>{event.minute}'</Text>
                      </View>
                      {/* <TouchableOpacity
                        onPress={() => handleDeleteEvent(event.id, event.type, event.cardType, event.team, event)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: theme.accent1,
                          justifyContent: "center",
                          alignItems: "center",
                          marginLeft: 8,
                        }}
                      >
                        <Ionicons name="close" size={16} color={theme.background} />
                      </TouchableOpacity> */}
                      {/* <TouchableOpacity
                          onPress={() => handleEditEvent(event)}
                          style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: theme.accent3,
                          justifyContent: "center",
                          alignItems: "center",
                          marginLeft: 8,
                        }}
                      >
                        < Entypo name="edit" size={16} color={theme.background} />
                      </TouchableOpacity> */}
                    </View>
                  ))
                )}
              </View>
            ) : (
              <View style={styles.contentCard}>
                <Text style={styles.contentTitle}>Estadísticas</Text>

                {/* Goals */}
                <View style={styles.statSection}>
                  <View style={styles.statHeader}>
                    {/* <Trophy size={20} color={theme.textPrimary} /> */}
                    <Text style={styles.statTitle}>Goles</Text>
                  </View>

                  <View style={styles.statRow}>
                    <View style={styles.statTeam}>
                      <Text
                        style={styles.statTeamName}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {matchData.localTeam}
                      </Text>
                      <Text style={styles.statValue}>{stats.goals.local}</Text>
                    </View>

                    <View style={styles.statTeam}>
                      <Text
                        style={styles.statTeamName}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {matchData.visitorTeam}
                      </Text>
                      <Text style={styles.statValue}>
                        {stats.goals.visitante}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Cards */}
                <View style={styles.statSection}>
                  <View style={styles.statHeader}>
                    <Ionicons
                      name="shield-outline"
                      size={20}
                      color={theme.textPrimary}
                    />
                    <Text style={styles.statTitle}>Tarjetas</Text>
                  </View>

                  <View style={styles.statRow}>
                    <View style={styles.statTeam}>
                      <Text style={styles.statTeamName}>
                        {matchData.localTeam}
                      </Text>
                      <View style={styles.cardContainer}>
                        <View
                          style={[
                            styles.cardCircle,
                            { backgroundColor: theme.primary },
                          ]}
                        >
                          <Text style={styles.cardCount}>
                            {stats.cards.local.amarilla}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.cardCircle,
                            { backgroundColor: theme.accent1 },
                          ]}
                        >
                          <Text style={styles.cardCount}>
                            {stats.cards.local.roja}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.cardCircle,
                            { backgroundColor: theme.accent3 },
                          ]}
                        >
                          <Text style={styles.cardCount}>
                            {stats.cards.local.azul}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.statTeam}>
                      <Text style={styles.statTeamName}>
                        {matchData.visitorTeam}
                      </Text>
                      <View style={styles.cardContainer}>
                        <View
                          style={[
                            styles.cardCircle,
                            { backgroundColor: theme.primary },
                          ]}
                        >
                          <Text style={styles.cardCount}>
                            {stats.cards.visitante.amarilla}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.cardCircle,
                            { backgroundColor: theme.accent1 },
                          ]}
                        >
                          <Text style={styles.cardCount}>
                            {stats.cards.visitante.roja}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.cardCircle,
                            { backgroundColor: theme.accent3 },
                          ]}
                        >
                          <Text style={styles.cardCount}>
                            {stats.cards.visitante.azul}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Additional info from API */}
                <View style={styles.statSection}>
                  <View style={styles.statHeader}>
                    <Text style={styles.statTitle}>Información adicional</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Liga:</Text>
                    <Text style={styles.infoValue}>
                      {matchData.league || "No especificada"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Temporada:</Text>
                    <Text style={styles.infoValue}>
                      {matchData.season || "No especificada"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Duración:</Text>
                    <Text style={styles.infoValue}>90 minutos</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Add extra padding at the bottom to ensure scrolling works well */}
            <View style={styles.bottomPadding} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {/* All modals */}
      <GoalModal
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAddGoal={handleAddGoal}
        currentMinute={90}
        teams={[
          { id: parsedTeam1?.id || 1, label: matchData.localTeam },
          { id: parsedTeam2?.id || 2, label: matchData.visitorTeam },
        ]}
        matchId={parsedMatchId}
      />

      <YellowCardModal
        isVisible={yellowCardModalVisible}
        onClose={() => setYellowCardModalVisible(false)}
        onAddYellowCard={handleAddYellowCard}
        currentMinute={90}
        teams={[
          { id: parsedTeam1?.id || 1, label: matchData.localTeam },
          { id: parsedTeam2?.id || 2, label: matchData.visitorTeam },
        ]}
        matchId={parsedMatchId}
      />

      <RedCardModal
        isVisible={redCardModalVisible}
        onClose={() => setRedCardModalVisible(false)}
        onAddRedCard={handleAddRedCard}
        currentMinute={90}
        teams={[
          { id: parsedTeam1?.id || 1, label: matchData.localTeam },
          { id: parsedTeam2?.id || 2, label: matchData.visitorTeam },
        ]}
        matchId={parsedMatchId}
      />

      <BlueCardModal
        isVisible={blueCardModalVisible}
        onClose={() => setBlueCardModalVisible(false)}
        onAddBlueCard={handleAddBlueCard}
        currentMinute={90}
        teams={[
          { id: parsedTeam1?.id || 1, label: matchData.localTeam },
          { id: parsedTeam2?.id || 2, label: matchData.visitorTeam },
        ]}
        matchId={parsedMatchId}
      />
      {editModalVisible && eventToEdit && (
        <EditEventModal
          isVisible={editModalVisible}
          eventData={eventToEdit}
          onClose={() => {
            setEditModalVisible(false);
            setEventToEdit(null);
          }}
          onSave={(updatedEvent) => {
            setEvents((prevEvents) =>
              prevEvents.map((e) =>
                e.id === updatedEvent.id ? updatedEvent : e
              )
            );
            setEditModalVisible(false);
            setEventToEdit(null);
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
    marginTop: 20,
  },
  scrollViewContent: {
    flexGrow: 1,
    minHeight: "100%",
    paddingBottom: 20,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "bold",
  },
  errorDetail: {
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
  },
  scoreCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 12,
    margin: 12,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchDate: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: "center",
    marginBottom: 4,
  },
  scoreHeader: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  scoreText: {
    fontSize: 16,
  },
  actionButtonsContainer: {
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: "row",
    paddingVertical: 4,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.background,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: 8,
  },
  actionButtonText: {
    marginLeft: 4,
    fontWeight: "500",
    fontSize: 13,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: theme.background,
  },
  activeTabButton: {
    backgroundColor: theme.cardBackground,
  },
  tabButtonText: {
    fontWeight: "500",
    color: theme.textSecondary,
  },
  activeTabButtonText: {
    color: theme.textPrimary,
    fontWeight: "bold",
  },
  contentCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyContentCard: {
    minHeight: 300, // Ensure minimum height when empty
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  noEventsText: {
    textAlign: "center",
    color: theme.textSecondary,
    padding: 20,
  },
  eventItem: {
    flexDirection: "row",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  eventIconContainer: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  eventContent: {
    flex: 1,
    paddingHorizontal: 8,
  },
  eventTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  cardIndicator: {
    backgroundColor: theme.primary,
    color: theme.textPrimary,
    fontWeight: "bold",
    borderRadius: 12,
    overflow: "hidden",
    paddingHorizontal: 4,
  },
  eventPlayer: {
    color: theme.textPrimary,
  },
  eventAssistant: {
    color: theme.textSecondary,
  },
  eventTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 50,
    justifyContent: "flex-end",
  },
  eventTime: {
    marginLeft: 4,
    color: theme.textSecondary,
  },
  statSection: {
    marginBottom: 24,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  statTeam: {
    flex: 1,
    alignItems: "center",
  },
  statTeamName: {
    textAlign: "center",
    fontSize: 12,
    minHeight: 40,
    flexGrow: 1,
    maxWidth: "90%",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
  },
  cardContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  cardCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  cardCount: {
    color: theme.textPrimary,
    fontWeight: "bold",
  },
  infoRow: {
    flexDirection: "row",
    paddingVertical: 5,
  },
  infoLabel: {
    fontWeight: "bold",
    width: 100,
  },
  infoValue: {
    flex: 1,
  },
  bottomPadding: {
    height: 40, 
  },
  eventsLoadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    minHeight: 200,
  },
  eventsLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.textSecondary,
  },
  wrapper: {
    flex: 1,
    justifyContent: "center", 
    alignItems: "center",     
  },
})