"use client"
import { Picker } from "@react-native-picker/picker"
import React, { useState, useEffect } from "react"
import { Modal, View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator } from "react-native"

interface EditEventModalProps {
  isVisible: boolean
  onClose: () => void
  eventData: {
    id: number
    type: "gol" | "tarjeta"
    player: string
    playerId?: number
    team: "local" | "visitante"
    minute: number
    assistant?: string
  }
  onSave: (updatedEvent: any) => void
}
type Player = {
  id: number
  label: string
}

const EditEventModal: React.FC<EditEventModalProps> = ({ isVisible, onClose, eventData, onSave }) => {
  const [minute, setMinute] = useState(eventData.minute.toString())
  const [updatedPlayer, setUpdatedPlayer] = useState(eventData.player)
  const [selectedScorerId, setSelectedScorerId] = useState<number | null>(eventData.playerId || null)
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false)

  useEffect(() => {
    setMinute(eventData.minute.toString())
    setUpdatedPlayer(eventData.player)
    setSelectedScorerId(eventData.playerId || null)
  }, [eventData])

  useEffect(() => {
    if (isVisible) {
      const fetchPlayers = async () => {
        setIsLoadingPlayers(true)
        try {
          const response = await fetch("https://luxoradevs.com/jp/wp-json/sportspress/v2/players")
          if (!response.ok) {
            throw new Error(`Error: ${response.status}`)
          }
          const data = await response.json()
          let formattedData: Player[] = []
          if (Array.isArray(data)) {
            for (let i = 0; i < data.length; i++) {
              const item = data[i]
              if (item && item.id && item.title && item.title.rendered) {
                formattedData.push({ id: item.id, label: item.title.rendered })
              }
            }
          }
          setPlayers(formattedData)
        } catch (error) {
          console.error("Error al cargar jugadores:", error)
          Alert.alert("Error", "No se pudieron cargar los jugadores, inténtalo de nuevo.")
        } finally {
          setIsLoadingPlayers(false)
        }
      }
      fetchPlayers()
    }
  }, [isVisible])

  const renderPlayerItems = () => {
    const items = [<Picker.Item key="default-player" label="Seleccione un jugador" value={null} />]
    players.forEach((player) => {
      items.push(<Picker.Item key={`player-${player.id}`} label={player.label} value={player.id} />)
    })
    return items
  }

  const handleSave = () => {
    const newMinute = Number.parseInt(minute)
    if (!newMinute || newMinute <= 0) {
      Alert.alert("Error", "Por favor, ingrese un minuto válido")
      return
    }
    let finalPlayer = updatedPlayer
    if (selectedScorerId) {
      const selectedPlayer = players.find((p) => p.id === selectedScorerId)
      if (selectedPlayer) {
        finalPlayer = selectedPlayer.label
      }
    }
    if (!finalPlayer || finalPlayer.trim() === "") {
      Alert.alert("Error", "Por favor, ingrese un jugador válido")
      return
    }
    const updatedEvent = { ...eventData, minute: newMinute, player: finalPlayer, playerId: selectedScorerId }
    onSave(updatedEvent)
  }

  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Editar Evento</Text>
          <Text style={styles.label}>Tipo: {eventData.type === "gol" ? "Gol" : "Tarjeta"}</Text>
          <Text style={styles.label}>Equipo: {eventData.team}</Text>
          
          <Text style={styles.label}>Jugador (actual: {eventData.player}):</Text>
          <TextInput
            style={styles.textInput}
            value={updatedPlayer}
            onChangeText={setUpdatedPlayer}
            placeholder="Ingrese el jugador manualmente"
            maxLength={50}
          />
          {isLoadingPlayers ? (
            <ActivityIndicator size="small" color="#0066CC" />
          ) : (
            <Picker
              selectedValue={selectedScorerId}
              onValueChange={(itemValue) => setSelectedScorerId(itemValue ? Number(itemValue) : null)}
              style={styles.picker}
              enabled={true}
            >
              {renderPlayerItems()}
            </Picker>
          )}

          <Text style={styles.label}>Minuto:</Text>
          <TextInput
            style={styles.textInput}
            value={minute}
            onChangeText={setMinute}
            keyboardType="numeric"
            placeholder="Ingrese el minuto"
            maxLength={3}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalButton} onPress={handleSave}>
              <Text style={styles.modalButtonText}>Guardar Cambios</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: "gray" }]} onPress={onClose}>
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
    backgroundColor: "rgba(0,0,0,0.5)",
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
  label: {
    fontSize: 14,
    marginVertical: 5,
  },
  textInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  modalButton: {
    backgroundColor: "#0066CC",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  picker: {
    height: 50,
    width: "100%",
  },
})

export default EditEventModal