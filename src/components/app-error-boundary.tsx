import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';

type State = { error: Error | null };

export class AppErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled application error:', error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.container}>
        <Text style={styles.eyebrow}>GEET MUSIC</Text>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>The player is still safe. Restart this screen to continue listening.</Text>
        <Pressable onPress={() => this.setState({ error: null })} style={styles.button}>
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const colors = Colors.dark;
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 28, backgroundColor: colors.background },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', marginTop: 10 },
  message: { color: colors.textSecondary, fontSize: 15, lineHeight: 23, marginTop: 10 },
  button: { alignSelf: 'flex-start', marginTop: 24, borderRadius: 18, backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12 },
  buttonText: { color: colors.onPrimary, fontWeight: '800' },
});
