"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput } from "react-native"
import { Picker } from "@react-native-picker/picker"

type Team = {
  id: number
  label: string
}

type Player = {
  id: number
  label: string
}

type MatchEvent = any

interface GoalModalProps {
  isVisible: boolean
  onClose: () => void
  onAddGoal: (team: Team, scorer: Player, assistant: Player | null, minute: number) => void
  currentMinute: number
  teams: Team[]
  matchId?: string
}

const GoalModal: React.FC<GoalModalProps> = ({ isVisible, onClose, onAddGoal, currentMinute, teams, matchId = "" }) => {
  // Inicializar con valores nulos o "vacíos"
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [selectedScorerId, setSelectedScorerId] = useState<number | null>(null)
  const [selectedAssistantId, setSelectedAssistantId] = useState<number | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false)
  const [minute, setMinute] = useState<string>(currentMinute.toString())
  const authUsername = "admin"
  const authPassword = "g9wX YDBx p5vR jQ9i z5aa 9b5i"

  // Render team items safely
  const renderTeamItems = () => {
    const items = []
    items.push(<Picker.Item key="default-team" label="Seleccione un equipo" value={null} />)

    if (teams && teams.length > 0) {
      for (let i = 0; i < teams.length; i++) {
        const team = teams[i]
        items.push(<Picker.Item key={`team-${team.id}`} label={team.label} value={team.id} />)
      }
    }
    return items
  }

  const renderPlayerItems = () => {
    const items = []
    items.push(<Picker.Item key="default-player" label="Seleccione un jugador" value={null} />)

    if (players && players.length > 0) {
      for (let i = 0; i < players.length; i++) {
        const player = players[i]
        items.push(<Picker.Item key={`player-${player.id}`} label={player.label} value={player.id} />)
      }
    }

    return items
  }

  // Render assistant items safely
  const renderAssistantItems = () => {
    const items = []
    items.push(<Picker.Item key="default-assistant" label="Ninguno" value={null} />)

    if (players && players.length > 0) {
      for (let i = 0; i < players.length; i++) {
        const player = players[i]
        items.push(<Picker.Item key={`assistant-${player.id}`} label={player.label} value={player.id} />)
      }
    }

    return items
  }

  useEffect(() => {
    let isMounted = true;

    const fetchPlayers = async () => {
      if (!isVisible) return;

      setIsLoadingPlayers(true);
      try {
        const response = await fetch(
          "https://torneosfutbolbase.com/wp-json/sportspress/v2/players"
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();

        if (!isMounted) return;

        if (Array.isArray(data)) {
          const formattedData = [];
          for (let i = 0; i < data.length; i++) {
            const item = data[i];
            if (item && item.id && item.title && item.title.rendered) {
              formattedData.push({
                id: item.id,
                label: item.title.rendered,
              });
            }
          }
          setPlayers(formattedData);
        } else {
          console.error("Players data is not an array:", data);
          setPlayers([]);
        }
      } catch (error) {
        console.error("Error al obtener los jugadores:", error);
        if (isMounted) {
          Alert.alert(
            "Error",
            "No se pudieron cargar los jugadores. Por favor, inténtalo de nuevo.",
            [{ text: "OK" }]
          );
          setPlayers([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingPlayers(false);
        }
      }
    };

    if (isVisible) {
      fetchPlayers();
    }

    return () => {
      isMounted = false;
    };
  }, [isVisible]);

  // Reset form cuando el modal se hace visible
  useEffect(() => {
    if (isVisible) {
      resetDataForm();
    }
  }, [isVisible]);

  const updateMatchData = async (
    team: Team,
    scorer: Player,
    assistant: Player | null
  ) => {
    if (!matchId) {
      return false;
    }

    setIsSubmitting(true);

    try {
      // Fetch current match data first to get existing goals
      const getResponse = await fetch(
        `https://torneosfutbolbase.com/wp-json/sportspress/v2/events/${matchId}`,
        {
          method: "GET",
          headers: {
            Authorization: "Basic " + btoa(`${authUsername}:${authPassword}`),
            "Content-Type": "application/json",
          },
        }
      );

      if (!getResponse.ok) {
        throw new Error(`Error fetching match data: ${getResponse.status}`);
      }

      const matchData = await getResponse.json();
      // Extract existing goals data or initialize empty array
      const existingGoals = Array.isArray(matchData.goals_data)
        ? matchData.goals_data
        : [];

      // Get team IDs from the match data
      const teamIds = Array.isArray(matchData.teams) ? matchData.teams : [];
      const team1Id = teamIds.length > 0 ? teamIds[0] : 0;
      const team2Id = teamIds.length > 1 ? teamIds[1] : 0;

      // Get current goals count
      const team1Goals = Number.parseInt(
        matchData.results &&
          matchData.results[team1Id] &&
          matchData.results[team1Id].goals
          ? matchData.results[team1Id].goals
          : "0"
      );
      const team2Goals = Number.parseInt(
        matchData.results &&
          matchData.results[team2Id] &&
          matchData.results[team2Id].goals
          ? matchData.results[team2Id].goals
          : "0"
      );

      // Determine which team scored and update the count
      const isTeam1 = team.id === team1Id;
      const newTeam1Goals = isTeam1 ? team1Goals + 1 : team1Goals;
      const newTeam2Goals = isTeam1 ? team2Goals : team2Goals + 1;

      // Get the minute from the input field
      const goalMinute = Number.parseInt(minute) || currentMinute;

      // Create new goal data entry
      const newGoal = {
        team_id: team.id,
        player_id: scorer.id,
        minute: goalMinute,
        assist_by: assistant ? assistant.id : null,
      };

      // Add new goal to existing goals
      const updatedGoals = [...existingGoals, newGoal];

      // Initialize the update payload with only what we need to update
      const updatePayload: {
        main_results: [string, string];
        results: Record<string, { goals: string }>;
        goals_data: any;
        performance: Record<string, Record<string, any>>;
      } = {
        main_results: [newTeam1Goals.toString(), newTeam2Goals.toString()],
        results: {
          [team1Id]: {
            goals: newTeam1Goals.toString(),
          },
          [team2Id]: {
            goals: newTeam2Goals.toString(),
          },
        },
        goals_data: updatedGoals,
        performance: {},
      };

      // Initialize performance object structure
      updatePayload.performance = {};

      // Only include the team that scored
      updatePayload.performance[team.id] = {};

      // Initialize team entry "0" if it doesn't exist
      if (!updatePayload.performance[team.id]["0"]) {
        updatePayload.performance[team.id]["0"] = {};
      }

      // Get current team goals or default to 0
      let currentTeamGoals = 0;
      let existingTeamGoalMinutes = [];

      // Parse existing team goals data if it exists
      if (
        matchData.performance &&
        matchData.performance[team.id] &&
        matchData.performance[team.id]["0"] &&
        matchData.performance[team.id]["0"].goals
      ) {
        // Check if the goals field already has minute information
        const teamGoalsMatch = matchData.performance[team.id]["0"].goals.match(
          /^(\d+)(?:\s*$$(.*?)$$)?$/
        );
        if (teamGoalsMatch) {
          currentTeamGoals = Number.parseInt(teamGoalsMatch[1]);
          // Extract existing minutes if they exist
          if (teamGoalsMatch[2]) {
            existingTeamGoalMinutes = teamGoalsMatch[2]
              .split(", ")
              .map((m) => m.replace("'", ""));
          }
        } else {
          // If no match, just try to parse as a number
          currentTeamGoals =
            Number.parseInt(matchData.performance[team.id]["0"].goals) || 0;
        }
      }

      // Add the new minute to the list
      existingTeamGoalMinutes.push(goalMinute.toString());

      // Format the goals field with count and minutes for the team
      updatePayload.performance[team.id]["0"] = {
        ...updatePayload.performance[team.id]["0"],
        goals: `${currentTeamGoals + 1} (${existingTeamGoalMinutes.join(
          "', "
        )}')`,
      };

      // Update team assists if there is an assistant
      if (assistant) {
        // Get current team assists or default to 0
        let currentTeamAssists = 0;
        let existingTeamAssistMinutes = [];

        // Parse existing team assists data if it exists
        if (
          matchData.performance &&
          matchData.performance[team.id] &&
          matchData.performance[team.id]["0"] &&
          matchData.performance[team.id]["0"].assists
        ) {
          // Check if the assists field already has minute information
          const teamAssistsMatch = matchData.performance[team.id][
            "0"
          ].assists.match(/^(\d+)(?:\s*$$(.*?)$$)?$/);
          if (teamAssistsMatch) {
            currentTeamAssists = Number.parseInt(teamAssistsMatch[1]);
            // Extract existing minutes if they exist
            if (teamAssistsMatch[2]) {
              existingTeamAssistMinutes = teamAssistsMatch[2]
                .split(", ")
                .map((m) => m.replace("'", ""));
            }
          } else {
            // If no match, just try to parse as a number
            currentTeamAssists =
              Number.parseInt(matchData.performance[team.id]["0"].assists) || 0;
          }
        }

        // Add the new minute to the list
        existingTeamAssistMinutes.push(goalMinute.toString());

        // Format the assists field with count and minutes for the team
        updatePayload.performance[team.id]["0"] = {
          ...updatePayload.performance[team.id]["0"],
          assists: `${currentTeamAssists + 1} (${existingTeamAssistMinutes.join(
            "', "
          )}')`,
        };
      }

      // Update scorer's goals - get existing data first
      if (scorer?.id) {
        // Get existing player data if available
        const existingPlayerData =
          matchData.performance &&
          matchData.performance[team.id] &&
          matchData.performance[team.id][scorer.id]
            ? { ...matchData.performance[team.id][scorer.id] }
            : {};

        // Get current goals for the scorer or default to 0
        let currentGoals = 0;
        let existingGoalMinutes = [];

        // Parse existing goals data if it exists
        if (existingPlayerData.goals) {
          // Check if the goals field already has minute information
          const goalsMatch = existingPlayerData.goals.match(
            /^(\d+)(?:\s*$$(.*?)$$)?$/
          );
          if (goalsMatch) {
            currentGoals = Number.parseInt(goalsMatch[1]);
            // Extract existing minutes if they exist
            if (goalsMatch[2]) {
              existingGoalMinutes = goalsMatch[2]
                .split(", ")
                .map((m) => m.replace("'", ""));
            }
          } else {
            // If no match, just try to parse as a number
            currentGoals = Number.parseInt(existingPlayerData.goals) || 0;
          }
        }

        // Add the new minute to the list
        existingGoalMinutes.push(goalMinute.toString());

        // Format the goals field with count and minutes
        existingPlayerData.goals = `${
          currentGoals + 1
        } (${existingGoalMinutes.join("', ")}')`;

        // Add updated player data to payload
        updatePayload.performance[team.id][scorer.id] = existingPlayerData;
      }

      // Update assistant's assists if there is one
      if (assistant?.id) {
        // Get existing player data if available
        const existingPlayerData =
          matchData.performance &&
          matchData.performance[team.id] &&
          matchData.performance[team.id][assistant.id]
            ? { ...matchData.performance[team.id][assistant.id] }
            : {};

        // Get current assists for the assistant or default to 0
        let currentAssists = 0;
        let existingAssistMinutes = [];

        // Parse existing assists data if it exists
        if (existingPlayerData.assists) {
          // Check if the assists field already has minute information
          const assistsMatch = existingPlayerData.assists.match(
            /^(\d+)(?:\s*$$(.*?)$$)?$/
          );
          if (assistsMatch) {
            currentAssists = Number.parseInt(assistsMatch[1]);
            // Extract existing minutes if they exist
            if (assistsMatch[2]) {
              existingAssistMinutes = assistsMatch[2]
                .split(", ")
                .map((m) => m.replace("'", ""));
            }
          } else {
            // If no match, just try to parse as a number
            currentAssists = Number.parseInt(existingPlayerData.assists) || 0;
          }
        }

        // Add the new minute to the list
        existingAssistMinutes.push(goalMinute.toString());

        // Format the assists field with count and minutes
        existingPlayerData.assists = `${
          currentAssists + 1
        } (${existingAssistMinutes.join("', ")}')`;

        // Add updated player data to payload
        updatePayload.performance[team.id][assistant.id] = existingPlayerData;
      }

      console.log("Update Payload:", updatePayload);

      // Send the update request
      const updateResponse = await fetch(
        `https://torneosfutbolbase.com/wp-json/sportspress/v2/events/${matchId}`,
        {
          method: "POST",
          headers: {
            Authorization: "Basic " + btoa(`${authUsername}:${authPassword}`),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatePayload),
        }
      );

      if (!updateResponse.ok) {
        throw new Error(`Error updating match data: ${updateResponse.status}`);
      }

      return true;
    } catch (error) {
      console.error("Error updating match data:", error);
      Alert.alert(
        "Error",
        "No se pudo actualizar los datos del partido en el servidor. El gol se registrará localmente.",
        [{ text: "OK" }]
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddGoal = async () => {
    if (!selectedTeamId) {
      Alert.alert("Error", "Selecciona un equipo que anotó el gol")
      return
    }

    if (!selectedScorerId) {
      Alert.alert("Error", "Selecciona un jugador que anotó el gol")
      return
    }

    if (!minute || Number.parseInt(minute) <= 0) {
      Alert.alert("Error", "Ingresa un minuto válido para el gol")
      return
    }

    // Find the selected team
    let team: Team | undefined
    if (teams && teams.length > 0) {
      for (let i = 0; i < teams.length; i++) {
        if (teams[i].id === selectedTeamId) {
          team = teams[i]
          break
        }
      }
    }

    // Find the selected scorer
    let scorer: Player | undefined
    if (players && players.length > 0) {
      for (let i = 0; i < players.length; i++) {
        if (players[i].id === selectedScorerId) {
          scorer = players[i]
          break
        }
      }
    }

    // Find the selected assistant (if any)
    let assistant: Player | null = null
    if (selectedAssistantId && players && players.length > 0) {
      for (let i = 0; i < players.length; i++) {
        if (players[i].id === selectedAssistantId) {
          assistant = players[i]
          break
        }
      }
    }

    if (!team || !scorer) {
      Alert.alert("Error", "Error al encontrar el equipo o jugador seleccionado")
      return
    }

    const goalMinute = Number.parseInt(minute)

    // First update the server
    const serverUpdateSuccess = await updateMatchData(team, scorer, assistant)

    // Then update local state regardless of server success
    onAddGoal(team, scorer, assistant, goalMinute)
    resetDataForm()
    onClose()

    // Show success message if server update was successful
    if (serverUpdateSuccess) {
      Alert.alert("Éxito", "Gol registrado correctamente en el servidor")
    }
  }

  const resetDataForm = () => {
    setSelectedTeamId(null)
    setSelectedScorerId(null)
    setSelectedAssistantId(null)
    setMinute(currentMinute.toString())
  }

  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Registrar Gol</Text>

          {isLoadingPlayers ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ffcc00" />
              <Text style={styles.loadingText}>Cargando jugadores...</Text>
            </View>
          ) : (
            <>
              <View style={styles.pickerContainer}>
                <Text style={styles.label}>Equipo que anotó el gol:</Text>
                <Picker
                  selectedValue={selectedTeamId}
                  onValueChange={(itemValue) => setSelectedTeamId(Number(itemValue))}
                  style={styles.picker}
                  enabled={!isSubmitting}
                >
                  {renderTeamItems()}
                </Picker>
              </View>

              <View style={styles.pickerContainer}>
                <Text style={styles.label}>Jugador que anotó el gol:</Text>
                <Picker
                  selectedValue={selectedScorerId}
                  onValueChange={(itemValue) => setSelectedScorerId(Number(itemValue))}
                  style={styles.picker}
                  enabled={!isSubmitting}
                >
                  {renderPlayerItems()}
                </Picker>
              </View>

              <View style={styles.pickerContainer}>
                <Text style={styles.label}>Asistente (opcional):</Text>
                <Picker
                  selectedValue={selectedAssistantId}
                  onValueChange={(itemValue) => setSelectedAssistantId(itemValue ? Number(itemValue) : null)}
                  style={styles.picker}
                  enabled={!isSubmitting}
                >
                  {renderAssistantItems()}
                </Picker>
              </View>

              <View style={styles.pickerContainer}>
                <Text style={styles.label}>Minuto del gol:</Text>
                <TextInput
                  style={styles.textInput}
                  value={minute}
                  onChangeText={setMinute}
                  keyboardType="numeric"
                  placeholder="Ingrese el minuto"
                  maxLength={3}
                  editable={!isSubmitting}
                />
              </View>
            </>
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, (isSubmitting || isLoadingPlayers) && styles.disabledButton]}
              onPress={handleAddGoal}
              disabled={isSubmitting || isLoadingPlayers}
            >
              <Text style={styles.modalButtonText}>{isSubmitting ? "Procesando..." : "Agregar Gol"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: "gray" }]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.modalButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  pickerContainer: {
    marginBottom: 15,
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 5,
  },
  picker: {
    backgroundColor: "#f5f5f5",
    borderRadius: 5,
    marginBottom: 5,
  },
  textInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: "row",
    marginTop: 15,
    justifyContent: "space-between",
  },
  modalButton: {
    backgroundColor: "#ffcc00",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  modalButtonText: {
    fontWeight: "bold",
    color: "#000",
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
  },
})

export default GoalModal;
