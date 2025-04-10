import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type CronometroProps = {
  finalTimeInMinutes?: number;
};

const Cronometro: React.FC<CronometroProps> = ({ finalTimeInMinutes = 20 }) => {
  const [elapsed, setElapsed] = useState(0);
  const [finalTime, setFinalTime] = useState(finalTimeInMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [customAdd, setCustomAdd] = useState<string>("0");
  const [firstSavedTime, setFirstSavedTime] = useState<string | null>(null);
  const [secondSavedTime, setSecondSavedTime] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const loadSavedData = async () => {
      const [first, second, final, isRunning, start] = await Promise.all([
        AsyncStorage.getItem("firstSavedTime"),
        AsyncStorage.getItem("secondSavedTime"),
        AsyncStorage.getItem("finalTime"),
        AsyncStorage.getItem("isActive"),
        AsyncStorage.getItem("startTimestamp"),
      ]);

      if (first) setFirstSavedTime(first);
      if (second) setSecondSavedTime(second);
      if (final) setFinalTime(Number(final));

      if (isRunning === "true" && start) {
        const startTimestamp = parseInt(start);
        const now = Date.now();
        const secondsPassed = Math.floor((now - startTimestamp) / 1000);
        setElapsed(secondsPassed);
        setIsActive(true);
      }
    };
    loadSavedData();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem("finalTime", finalTime.toString());
  }, [finalTime]);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev + 1 >= finalTime) {
            clearInterval(intervalRef.current!);
            return finalTime;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, finalTime]);

  useEffect(() => {
    if (elapsed >= finalTime && finalTime > 0) {
      setIsActive(false);
      const currentTime = formatTime(elapsed);
      const saveTime = async () => {
        if (!firstSavedTime) {
          setFirstSavedTime(currentTime);
          await AsyncStorage.setItem("firstSavedTime", currentTime);
        } else if (!secondSavedTime) {
          setSecondSavedTime(currentTime);
          await AsyncStorage.setItem("secondSavedTime", currentTime);
        }
      };
      saveTime();
      setElapsed(0);
    }
  }, [elapsed]);

  const startTimer = async () => {
    const start = Date.now().toString();
    await AsyncStorage.setItem("startTimestamp", start);
    await AsyncStorage.setItem("isActive", "true");
    setIsActive(true);
  };

  const pauseTimer = async () => {
    await AsyncStorage.setItem("isActive", "false");
    setIsActive(false);
  };

  const addOneMinute = () => {
    setFinalTime((prev) => prev + 60);
  };

  const subtractOneMinute = () => {
    setFinalTime((prev) => (prev - 60 > 0 ? prev - 60 : 0));
  };

  const addCustomMinutes = () => {
    const minutesToAdd = parseFloat(customAdd);
    if (!isNaN(minutesToAdd) && minutesToAdd > 0) {
      setFinalTime((prev) => prev + Math.floor(minutesToAdd * 60));
    }
  };

  const resetTimer = async () => {
    setElapsed(0);
    setIsActive(false);
    setFirstSavedTime(null);
    setSecondSavedTime(null);
    await AsyncStorage.multiRemove([
      "firstSavedTime",
      "secondSavedTime",
      "startTimestamp",
      "finalTime",
      "isActive",
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.endTimeText}>Duración del partido: 40'</Text>
      <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
      <Text style={styles.endTimeText}>
        Duración de cada tiempo: {formatTime(finalTime)}
      </Text>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.button} onPress={addOneMinute}>
          <Text style={styles.buttonText}>+1 minuto</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "orange" }]}
          onPress={subtractOneMinute}
        >
          <Text style={styles.buttonText}>-1 minuto</Text>
        </TouchableOpacity>
        <View style={styles.customContainer}>
          <TextInput
            style={styles.input}
            value={customAdd}
            onChangeText={setCustomAdd}
            keyboardType="numeric"
            placeholder="Minutos"
          />
          <TouchableOpacity style={styles.button} onPress={addCustomMinutes}>
            <Text style={styles.buttonText}>Agregar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!isActive && elapsed === 0 ? (
        <TouchableOpacity style={styles.startButton} onPress={startTimer}>
          <Text style={styles.buttonText}>Iniciar</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.pauseButton} onPress={pauseTimer}>
          <Text style={styles.buttonText}>
            {isActive ? "Pausar" : "Reanudar"}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.savedContainer}>
        <Text style={styles.savedTitle}>Tiempos guardados:</Text>
        <Text style={styles.savedTime}>
          1️⃣ Primer tiempo: {firstSavedTime || "Sin iniciar 1er tiempo"}
        </Text>
        <Text style={styles.savedTime}>
          2️⃣ Segundo tiempo: {secondSavedTime || "Sin iniciar 2do tiempo"}
        </Text>
      </View>
      <TouchableOpacity style={styles.resetButton} onPress={resetTimer}>
        <Text style={styles.buttonText}>Eliminar datos</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Cronometro;

const styles = StyleSheet.create({
  container: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#f9f9f9",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
    marginVertical: 20,
  },
  timerText: {
    fontSize: 60,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  endTimeText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 15,
  },
  buttonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  customContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  button: {
    backgroundColor: "#0066CC",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginHorizontal: 5,
    marginVertical: 5,
    minWidth: 100,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  input: {
    width: 70,
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginRight: 10,
    textAlign: "center",
    borderRadius: 10,
    backgroundColor: "#fff",
    fontSize: 16,
    paddingHorizontal: 5,
  },
  startButton: {
    backgroundColor: "#28a745",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 12,
    marginTop: 10,
  },
  pauseButton: {
    backgroundColor: "#888",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 12,
    marginTop: 10,
  },
  resetButton: {
    backgroundColor: "#dc3545",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 12,
    marginTop: 15,
  },
  savedContainer: {
    marginTop: 25,
    width: "100%",
    paddingHorizontal: 10,
  },
  savedTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  savedTime: {
    fontSize: 15,
    color: "#555",
    marginBottom: 5,
  },
});