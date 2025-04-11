import React, { useEffect, useRef, useState } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";

const TypingText = () => {
  const fullText = "Cargando datos...";
  const [displayedText, setDisplayedText] = useState("");
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  // Cursor blinking animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cursorOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Typing animation
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(fullText.slice(0, index + 1));
      index++;
      if (index === fullText.length) index = 0;
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {displayedText}
        <Animated.Text style={[styles.cursor, { opacity: cursorOpacity }]}>
          |
        </Animated.Text>
      </Text>
    </View>
  );
};

export default TypingText;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  text: {
    color: "#000000",
    fontSize: 18,
    fontFamily: "Courier",
    fontWeight: "bold",
  },
  cursor: {
    color: "#fff",
  },
});
