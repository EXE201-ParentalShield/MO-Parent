import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

type NotificationTone = 'info' | 'success' | 'warning' | 'urgent' | 'danger';

interface InAppNotificationBannerProps {
  visible: boolean;
  title: string;
  message?: string;
  tone?: NotificationTone;
  durationMs?: number;
  onDismiss: () => void;
  onPress?: () => void;
  avatarLabel?: string;
  timestampLabel?: string;
  onApprove?: () => void;
  onReject?: () => void;
}

const InAppNotificationBanner = ({
  visible,
  title,
  message,
  tone = 'info',
  durationMs = 4000,
  onDismiss,
  onPress,
  avatarLabel,
  timestampLabel,
  onApprove,
  onReject,
}: InAppNotificationBannerProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [isMounted, setIsMounted] = useState(visible);
  const shownAtRef = useRef<number>(Date.now());

  const translateY = useRef(new Animated.Value(-36)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const swipeY = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.8)).current;

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -42,
        duration: 180,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 160,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setIsMounted(false);
        onDismiss();
      }
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 8,
      onPanResponderMove: (_, gesture) => {
        swipeY.setValue(Math.min(0, gesture.dy));
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy < -28 || gesture.vy < -0.65) {
          dismiss();
          return;
        }

        Animated.spring(swipeY, {
          toValue: 0,
          bounciness: 7,
          speed: 15,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  useEffect(() => {
    if (!visible) {
      if (isMounted) {
        dismiss();
      }
      return;
    }

    shownAtRef.current = Date.now();
    setIsMounted(true);
    swipeY.setValue(0);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 2,
          bounciness: 10,
          speed: 20,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          bounciness: 6,
          speed: 20,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [dismiss, isMounted, opacity, swipeY, translateY, visible]);

  useEffect(() => {
    if (!visible || !isMounted) return;

    const timer = setTimeout(() => {
      dismiss();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [dismiss, durationMs, isMounted, visible]);

  useEffect(() => {
    if (!(tone === 'urgent' || tone === 'danger') || !isMounted) {
      pulse.stopAnimation();
      pulse.setValue(0.8);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.2,
          duration: 520,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.8,
          duration: 520,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [isMounted, pulse, tone]);

  const timeLabel = useMemo(() => {
    if (timestampLabel) return timestampLabel;
    const diffMs = Date.now() - shownAtRef.current;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'now';
    return `${mins}m ago`;
  }, [timestampLabel, visible]);

  if (!isMounted) return null;

  const palette = getPalette(tone, isDark);
  const topOffset = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 56;
  const avatarText = avatarLabel || getDefaultAvatar(tone);

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          top: topOffset,
          opacity,
          transform: [{ translateY: Animated.add(translateY, swipeY) }],
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.layer, styles.layerBack, { backgroundColor: palette.layerBack }]} />
      <View style={[styles.layer, styles.layerMid, { backgroundColor: palette.layerMid }]} />

      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: palette.background,
            borderColor: palette.border,
            shadowColor: palette.shadow,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Pressable
          style={styles.pressArea}
          onPress={onPress}
          disabled={!onPress}
          android_ripple={{ color: isDark ? '#1F2937' : '#E5E7EB' }}
        >
          <View style={[styles.avatarWrap, { backgroundColor: palette.avatarBg }]}> 
            <Text style={styles.avatarText}>{avatarText}</Text>
            {(tone === 'urgent' || tone === 'danger') && (
              <Animated.View
                style={[
                  styles.pulseDot,
                  {
                    backgroundColor: palette.dot,
                    transform: [{ scale: pulse }],
                    opacity: pulse,
                  },
                ]}
              />
            )}
          </View>

          <View style={styles.content}>
            <Text style={[styles.title, { color: palette.title }]} numberOfLines={1}>
              {title}
            </Text>
            {message ? (
              <Text style={[styles.message, { color: palette.message }]} numberOfLines={2}>
                {renderHighlighted(message, palette.highlight)}
              </Text>
            ) : null}
          </View>

          <View style={styles.metaCol}>
            <Text style={[styles.time, { color: palette.time }]}>{timeLabel}</Text>
            <Pressable onPress={dismiss} hitSlop={8}>
              <Text style={[styles.close, { color: palette.time }]}>×</Text>
            </Pressable>
          </View>
        </Pressable>

        {(onApprove || onReject) && (
          <View style={styles.actionsRow}>
            {onReject ? (
              <Pressable style={[styles.actionButton, styles.rejectButton]} onPress={onReject}>
                <Text style={styles.rejectText}>Từ chối</Text>
              </Pressable>
            ) : null}
            {onApprove ? (
              <Pressable style={[styles.actionButton, styles.approveButton]} onPress={onApprove}>
                <Text style={styles.approveText}>Duyệt</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
};

const renderHighlighted = (text: string, color: string) => {
  const keyword = 'yêu cầu';
  const lower = text.toLowerCase();
  const index = lower.indexOf(keyword);
  if (index === -1) return text;

  const before = text.slice(0, index);
  const target = text.slice(index, index + keyword.length);
  const after = text.slice(index + keyword.length);

  return (
    <>
      {before}
      <Text style={{ color, fontWeight: '700' }}>{target}</Text>
      {after}
    </>
  );
};

const getDefaultAvatar = (tone: NotificationTone) => {
  switch (tone) {
    case 'success':
      return '✓';
    case 'warning':
      return '!';
    case 'urgent':
    case 'danger':
      return '•';
    default:
      return '•';
  }
};

const getPalette = (tone: NotificationTone, isDark: boolean) => {
  const base = {
    info: '#2563EB',
    success: '#16A34A',
    warning: '#EA580C',
    urgent: '#DC2626',
    danger: '#DC2626',
  }[tone];

  if (isDark) {
    return {
      background: '#111827',
      border: 'rgba(148,163,184,0.25)',
      title: '#F8FAFC',
      message: '#CBD5E1',
      highlight: '#E2E8F0',
      time: '#94A3B8',
      avatarBg: `${base}33`,
      dot: '#F87171',
      shadow: '#000000',
      layerBack: 'rgba(17,24,39,0.35)',
      layerMid: 'rgba(17,24,39,0.55)',
    };
  }

  return {
    background: 'rgba(255,255,255,0.96)',
    border: '#E2E8F0',
    title: '#0F172A',
    message: '#334155',
    highlight: '#1D4ED8',
    time: '#64748B',
    avatarBg: `${base}22`,
    dot: '#EF4444',
    shadow: 'rgba(2,6,23,0.28)',
    layerBack: 'rgba(148,163,184,0.18)',
    layerMid: 'rgba(148,163,184,0.26)',
  };
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    alignSelf: 'center',
    width: '88%',
    zIndex: 2000,
  },
  layer: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: '100%',
    borderRadius: 18,
  },
  layerBack: {
    top: 8,
  },
  layerMid: {
    top: 4,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
    overflow: 'hidden',
  },
  pressArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  pulseDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    top: 2,
    right: 2,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  metaCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 34,
  },
  time: {
    fontSize: 11,
    fontWeight: '600',
  },
  close: {
    fontSize: 18,
    lineHeight: 18,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 2,
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  approveButton: {
    backgroundColor: '#DCFCE7',
  },
  rejectButton: {
    backgroundColor: '#FEF2F2',
  },
  approveText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
  },
  rejectText: {
    color: '#991B1B',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default InAppNotificationBanner;
