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

  useEffect(() => {
    const loadSavedTimes = async () => {
      const first = await AsyncStorage.getItem("firstSavedTime");
      const second = await AsyncStorage.getItem("secondSavedTime");

      if (first) setFirstSavedTime(first);
      if (second) setSecondSavedTime(second);
    };
    loadSavedTimes();
  }, []);

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
          // console.log("Primer tiempo guardado:", currentTime);
        } else if (!secondSavedTime) {
          setSecondSavedTime(currentTime);
          await AsyncStorage.setItem("secondSavedTime", currentTime);
          // console.log("Segundo tiempo guardado:", currentTime);
        }
      };

      saveTime();
      setElapsed(0);
    }
  }, [elapsed]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
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

  return (
    <View style={styles.container}>
      <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
      <Text style={styles.endTimeText}>
        Tiempo del partido: {formatTime(finalTime)}
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
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => setIsActive(true)}
        >
          <Text style={styles.buttonText}>Iniciar</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.pauseButton}
          onPress={() => setIsActive((prev) => !prev)}
        >
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
    </View>
  );
};

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

export default Cronometro;
