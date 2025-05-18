import { icons } from "@/constants/icons";
import React, { useEffect } from "react";
import { Animated, Dimensions, Image, StyleSheet, View } from "react-native";

const { width, height } = Dimensions.get("window");

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const logoOpacity = new Animated.Value(0);
  const logoScale = new Animated.Value(0.3);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 10,
        friction: 2,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate to main app after animation
    const timer = setTimeout(() => {
      onFinish();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image source={icons.logo} style={styles.logo} resizeMode="contain" />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    width: width * 0.7,
    height: height * 0.3,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
});

export default SplashScreen;
