import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { Dimensions, Modal, Platform, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../../../contexts/ThemeContext";
import { useResponsive } from "../../../hooks/useResponsive";
import { ThemedText } from "../../ThemedText";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function ServiceBookingBottomSheet({
  visible,
  service,
  onClose,
}) {
  const theme = useTheme();
  const responsive = useResponsive();

  // Add comprehensive safety checks for theme destructuring
  const colors = theme?.colors || {};
  const spacing = theme?.spacing || {};
  const borderRadius = theme?.borderRadius || {};

  // Animation values
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const sheetOpacity = useSharedValue(0);

  // Modern gesture handler for drag to dismiss and resize
  const panGesture = Gesture.Pan()
    .onStart(() => {
      // Store the starting position
    })
    .onUpdate((event) => {
      // Only handle gestures that start from the top area (handle bar)
      // This allows ScrollView to handle its own scrolling
      if (event.absoluteY < 100) {
        // Only handle gestures from top 100px
        const newTranslateY = translateY.value + event.translationY;
        // Allow dragging up and down, but limit to screen bounds
        if (newTranslateY >= 0 && newTranslateY <= SCREEN_HEIGHT * 0.1) {
          translateY.value = newTranslateY;
        }
      }
    })
    .onEnd((event) => {
      // Only handle dismiss/minimize if gesture started from top area
      if (event.absoluteY < 100) {
        const shouldDismiss = event.translationY > 100 || event.velocityY > 500;
        const shouldMinimize =
          event.translationY < -50 || event.velocityY < -500;

        if (shouldDismiss) {
          // Dismiss the bottom sheet
          translateY.value = withTiming(SCREEN_HEIGHT, { duration: 500 });
          backdropOpacity.value = withTiming(0, { duration: 400 });
          sheetOpacity.value = withTiming(0, { duration: 400 }, () => {
            runOnJS(onClose)();
          });
        } else if (shouldMinimize) {
          // Minimize to 1/4 of screen
          translateY.value = withSpring(SCREEN_HEIGHT * 0.75, {
            damping: 15,
            stiffness: 200,
          });
        } else {
          // Return to 90% of screen
          translateY.value = withSpring(SCREEN_HEIGHT * 0.1, {
            damping: 15,
            stiffness: 200,
          });
        }
      }
    });

  useEffect(() => {
    if (visible) {
      // Animate in to 90% of screen
      backdropOpacity.value = withTiming(1, { duration: 500 });
      translateY.value = withSpring(SCREEN_HEIGHT * 0.1, {
        damping: 15,
        stiffness: 200,
        mass: 1.0,
      });
      sheetOpacity.value = withTiming(1, { duration: 600 });
    } else {
      // Animate out
      backdropOpacity.value = withTiming(0, { duration: 400 });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 500 });
      sheetOpacity.value = withTiming(0, { duration: 400 });
    }
  }, [visible, backdropOpacity, sheetOpacity, translateY]);

  // Animated styles
  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: sheetOpacity.value,
  }));

  const handleBackdropPress = () => {
    onClose();
  };

  const styles = {
    modal: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    sheetContainer: {
      borderTopLeftRadius: borderRadius.xl || 24,
      borderTopRightRadius: borderRadius.xl || 24,
      height: SCREEN_HEIGHT * 0.9,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 16,
      overflow: "hidden",
    },
    gradientBackground: {
      flex: 1,
      borderTopLeftRadius: borderRadius.xl || 24,
      borderTopRightRadius: borderRadius.xl || 24,
    },
    handleContainer: {
      alignItems: "center",
      paddingVertical: responsive.isSmallScreen ? responsive.spacing.sm : responsive.spacing.md,
      paddingHorizontal: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
    },
    handleBar: {
      width: responsive.isSmallScreen ? responsive.responsive.width(10) : responsive.responsive.width(10),
      height: 4,
      backgroundColor: "rgba(255, 255, 255, 0.3)",
      borderRadius: 2,
    },
    content: {
      flex: 1,
      paddingTop: responsive.isSmallScreen ? responsive.spacing.xs : responsive.spacing.sm,
    },
    closeButton: {
      position: "absolute",
      top: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      right: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      width: responsive.isSmallScreen ? responsive.responsive.width(10) : responsive.responsive.width(10),
      height: responsive.isSmallScreen ? responsive.responsive.width(10) : responsive.responsive.width(10),
      borderRadius: responsive.isSmallScreen ? responsive.responsive.width(5) : responsive.responsive.width(5),
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      elevation: 10,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.3)",
    },
    serviceHeader: {
      paddingTop: responsive.isSmallScreen ? responsive.spacing.lg : responsive.spacing.xl,
      paddingBottom: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255, 255, 255, 0.2)",
      marginBottom: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
    },
    serviceName: {
      fontSize: responsive.isSmallScreen ? responsive.responsive.fontSize(2.0) : responsive.responsive.fontSize(2.2),
      fontWeight: "bold",
      color: "white",
      textAlign: "center",
      textShadowColor: "rgba(0, 0, 0, 0.3)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
      paddingBottom: responsive.isSmallScreen ? responsive.spacing.xs : responsive.spacing.sm,
    },
    placeholderContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: responsive.isSmallScreen ? responsive.spacing.md : responsive.spacing.lg,
    },
    placeholderText: {
      fontSize: responsive.isSmallScreen ? responsive.responsive.fontSize(1.5) : responsive.responsive.fontSize(1.6),
      color: "rgba(255, 255, 255, 0.8)",
      textAlign: "center",
      lineHeight: responsive.isSmallScreen ? 22 : 24,
      fontWeight: "bold",
    },
  };

  if (!service) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modal}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
          <TouchableWithoutFeedback onPress={handleBackdropPress}>
            <View style={{ flex: 1 }}>
              {Platform.OS === "ios" ? (
                <BlurView intensity={20} style={{ flex: 1 }} tint="dark" />
              ) : (
                <View
                  style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)" }}
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* Bottom Sheet */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.sheetContainer, sheetAnimatedStyle]}>
            <SafeAreaView style={{ flex: 1 }}>
              {/* Gradient Background */}
              <LinearGradient
                colors={[
                  colors.primary || "#6B46C1",
                  colors.primaryDark || "#553C9A",
                  colors.accent || "#EC4899",
                ]}
                style={styles.gradientBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Handle Bar */}
                <TouchableOpacity
                  style={styles.handleContainer}
                  activeOpacity={0.7}
                  onPress={() => {
                    console.log("Handle tapped");
                  }}
                >
                  <View style={styles.handleBar} />
                </TouchableOpacity>

                {/* Close Button */}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    console.log("Close button pressed");
                    onClose();
                  }}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons 
                    name="close" 
                    size={responsive.isSmallScreen ? responsive.responsive.width(5) : responsive.responsive.width(5)} 
                    color="white" 
                  />
                </TouchableOpacity>

                <View style={styles.content}>
                  {/* Service Header */}
                  <View style={styles.serviceHeader}>
                    <ThemedText style={styles.serviceName}>
                      {service?.name || "Service"}
                    </ThemedText>
                  </View>

                  {/* Placeholder Content */}
                  <View style={styles.placeholderContent}>
                    <ThemedText style={styles.placeholderText}>
                      Service booking functionality will be implemented here.
                    </ThemedText>
                  </View>
                </View>
              </LinearGradient>
            </SafeAreaView>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

