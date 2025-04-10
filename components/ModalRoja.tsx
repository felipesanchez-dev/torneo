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

interface RedCardModalProps {
  isVisible: boolean
  onClose: () => void
  onAddRedCard: (team: Team, player: Player, minute: number) => void
  currentMinute: number
  teams: Team[]
  matchId?: string
}

const RedCardModal: React.FC<RedCardModalProps> = ({
  isVisible,
  onClose,
  onAddRedCard,
  currentMinute,
  teams,
  matchId = "",
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false)
  const [minute, setMinute] = useState<string>(currentMinute.toString())

  // Updated auth credentials
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

  // Render player items safely
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

  useEffect(() => {
    let isMounted = true

    const fetchPlayers = async () => {
      if (!isVisible) return

      setIsLoadingPlayers(true)
      try {
        const response = await fetch("https://luxoradevs.com/jp/wp-json/sportspress/v2/players")

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }

        const data = await response.json()

        if (!isMounted) return

        if (Array.isArray(data)) {
          const formattedData = []
          for (let i = 0; i < data.length; i++) {
            const item = data[i]
            if (item && item.id && item.title && item.title.rendered) {
              formattedData.push({
                id: item.id,
                label: item.title.rendered,
              })
            }
          }
          setPlayers(formattedData)
        } else {
          console.error("Players data is not an array:", data)
          setPlayers([])
        }
      } catch (error) {
        console.error("Error al obtener los jugadores:", error)
        if (isMounted) {
          Alert.alert("Error", "No se pudieron cargar los jugadores. Por favor, inténtalo de nuevo.", [{ text: "OK" }])
          setPlayers([])
        }
      } finally {
        if (isMounted) {
          setIsLoadingPlayers(false)
        }
      }
    }

    if (isVisible) {
      fetchPlayers()
    }

    return () => {
      isMounted = false
    }
  }, [isVisible])

  useEffect(() => {
    if (isVisible) {
      resetDataForm()
    }
  }, [isVisible])

  const updateRedCardData = async (team: Team, player: Player, cardMinute: number) => {
    if (!matchId) {
      console.error("No match ID provided")
      return false
    }
  
    setIsSubmitting(true)
  
    try {
      // Fetch current match data to get the current red cards count
      const getResponse = await fetch(`https://luxoradevs.com/jp/wp-json/sportspress/v2/events/${matchId}`, {
        method: "GET",
        headers: {
          Authorization: "Basic " + btoa(`${authUsername}:${authPassword}`),
          "Content-Type": "application/json",
        },
      })
  
      if (!getResponse.ok) {
        throw new Error(`Error fetching match data: ${getResponse.status}`)
      }
  
      const matchData = await getResponse.json()
  
      // Get existing performance data or initialize
      const performance = matchData.performance || {}
      const teamIdStr = team.id.toString()
      const playerIdStr = player.id.toString()
  
      // Initialize team entry if it doesn't exist
      if (!performance[teamIdStr]) {
        performance[teamIdStr] = {}
      }
  
      // Initialize player entry if it doesn't exist
      if (!performance[teamIdStr][playerIdStr]) {
        performance[teamIdStr][playerIdStr] = {}
      }
  
      // Initialize team totals entry if it doesn't exist
      if (!performance[teamIdStr]["0"]) {
        performance[teamIdStr]["0"] = {}
      }
  
      // Get current red cards for the player or default to 0
      let currentRedCards = 0
      let existingMinutes = []
  
      // Parse existing red cards data if it exists
      if (performance[teamIdStr][playerIdStr].redcards) {
        // Check if the redcards field already has minute information
        const cardsMatch = performance[teamIdStr][playerIdStr].redcards.match(/^(\d+)(?:\s*\((.*)\))?$/)
        if (cardsMatch) {
          currentRedCards = Number.parseInt(cardsMatch[1])
          // Extract existing minutes if they exist
          if (cardsMatch[2]) {
            existingMinutes = cardsMatch[2].split(", ").map((m: string) => m.replace("'", ""))
          }
        } else {
          // If no match, just try to parse as a number
          currentRedCards = Number.parseInt(performance[teamIdStr][playerIdStr].redcards) || 0
        }
      }
  
      // Add the new minute to the list
      existingMinutes.push(cardMinute.toString())
  
      // Format the redcards field with count and minutes
      performance[teamIdStr][playerIdStr].redcards = `${currentRedCards + 1} (${existingMinutes.join("', ")}')`
  
      // Get current team red cards or default to 0
      let currentTeamRedCards = 0
      let teamExistingMinutes = []
  
      // Parse existing team red cards data if it exists 
      if (performance[teamIdStr]["0"].redcards) {
        // Check if the redcards field already has minute information
        const teamCardsMatch = performance[teamIdStr]["0"].redcards.match(/^(\d+)(?:\s*\((.*)\))?$/)
        if (teamCardsMatch) {
          currentTeamRedCards = Number.parseInt(teamCardsMatch[1])
          // Extract existing minutes if they exist
          if (teamCardsMatch[2]) {
            teamExistingMinutes = teamCardsMatch[2].split(", ").map((m: string) => m.replace("'", ""))
          }
        } else {
          // If no match, just try to parse as a number
          currentTeamRedCards = Number.parseInt(performance[teamIdStr]["0"].redcards) || 0
        }
      }
  
      // Add the new minute to the team's list
      teamExistingMinutes.push(cardMinute.toString())
  
      // Format the redcards field with count and minutes for the team
      performance[teamIdStr]["0"].redcards = `${currentTeamRedCards + 1} (${teamExistingMinutes.join("', ")}')`
  
      // Prepare the update payload with the specified structure
      const updatePayload = {
        performance: performance,
      }
  
      // Send the update request
      const updateResponse = await fetch(`https://luxoradevs.com/jp/wp-json/sportspress/v2/events/${matchId}`, {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(`${authUsername}:${authPassword}`),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      })
  
      if (!updateResponse.ok) {
        const errorText = await updateResponse.text()
        console.error("API error response:", errorText)
        throw new Error(`Error updating match data: ${updateResponse.status}`)
      }
      return true
    } catch (error) {
      console.error("Error updating red card data:", error)
      Alert.alert(
        "Error",
        "No se pudo actualizar los datos de tarjeta roja en el servidor. La tarjeta se registrará localmente.",
        [{ text: "OK" }],
      )
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddRedCard = async () => {
    if (!selectedTeamId) {
      Alert.alert("Error", "Selecciona un equipo")
      return
    }

    if (!selectedPlayerId) {
      Alert.alert("Error", "Selecciona un jugador")
      return
    }

    if (!minute || Number.parseInt(minute) <= 0) {
      Alert.alert("Error", "Ingresa un minuto válido para la tarjeta")
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

    // Find the selected player
    let player: Player | undefined
    if (players && players.length > 0) {
      for (let i = 0; i < players.length; i++) {
        if (players[i].id === selectedPlayerId) {
          player = players[i]
          break
        }
      }
    }

    if (!team || !player) {
      Alert.alert("Error", "Error al encontrar el equipo o jugador seleccionado")
      return
    }

    const cardMinute = Number.parseInt(minute)

    // First update the server
    const serverUpdateSuccess = await updateRedCardData(team, player, cardMinute)

    // Then update local state with the correct team and minute
    onAddRedCard(team, player, cardMinute)
    resetDataForm()
    onClose()

    // Show success message if server update was successful
    if (serverUpdateSuccess) {
      Alert.alert("Éxito", "Tarjeta roja registrada correctamente en el servidor")
    }
  }

  const resetDataForm = () => {
    setSelectedTeamId(null)
    setSelectedPlayerId(null)
    setMinute(currentMinute.toString())
  }

  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Registrar Tarjeta Roja</Text>

          {isLoadingPlayers ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#E30613" />
              <Text style={styles.loadingText}>Cargando jugadores...</Text>
            </View>
          ) : (
            <>
              <View style={styles.pickerContainer}>
                <Text style={styles.label}>Equipo:</Text>
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
                <Text style={styles.label}>Jugador:</Text>
                <Picker
                  selectedValue={selectedPlayerId}
                  onValueChange={(itemValue) => setSelectedPlayerId(Number(itemValue))}
                  style={styles.picker}
                  enabled={!isSubmitting}
                >
                  {renderPlayerItems()}
                </Picker>
              </View>

              <View style={styles.pickerContainer}>
                <Text style={styles.label}>Minuto de la tarjeta:</Text>
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
              style={[
                styles.modalButton,
                { backgroundColor: "#E30613" },
                (isSubmitting || isLoadingPlayers) && styles.disabledButton,
              ]}
              onPress={handleAddRedCard}
              disabled={isSubmitting || isLoadingPlayers}
            >
              <Text style={[styles.modalButtonText, { color: "white" }]}>
                {isSubmitting ? "Procesando..." : "Agregar Tarjeta"}
              </Text>
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

export default RedCardModal;