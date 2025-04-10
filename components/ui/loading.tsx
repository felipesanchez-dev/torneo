import React, { useEffect, useRef } from 'react'
import { View, Animated, Easing, StyleSheet } from 'react-native'

type Props = {}

const Loading = (props: Props) => {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false
        })
      ])
    ).start();
  }, [animation]);

  const widthInterpolation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <View style={styles.loader}>
      <Animated.View style={[styles.animatedBar, { width: widthInterpolation }]} />
    </View>
  )
}

export default Loading

const styles = StyleSheet.create({
  loader: {
    width: 130,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 30,
    overflow: 'hidden',
    position: 'relative'
  },
  animatedBar: {
    backgroundColor: '#0071e2',
    height: '100%',
    borderRadius: 30,
    position: 'absolute',
    left: 0,
    top: 0
  }
});