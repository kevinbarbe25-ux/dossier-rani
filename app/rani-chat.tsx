import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  Keyboard, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import Animated, {
  FadeInLeft,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { sendChatMessage, ChatMessage } from '../src/services/ai';
import { TypingIndicator } from '../src/components/TypingIndicator';
import { COLORS, RADIUS, FONTS } from '../src/theme';

const WELCOME: ChatMessage = {
  role: 'assistant',
  content: "Salam ! Je suis Rani, ton assistant administratif marocain. Pose-moi n'importe quelle question sur tes démarches — CIN, passeport, carte grise, CNSS, impôts... Je réponds en français ou en darija.",
};

const STARTERS = [
  "Comment renouveler ma CIN ?",
  "Combien coûte un passeport ?",
  "Wach lazem contrôle technique chaque année ?",
  "Comment ouvrir un compte sans revenus fixes ?",
];

type Message = ChatMessage & { id: string; streaming?: boolean };

function StreamingText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      i += 2;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 12);
    return () => clearInterval(interval);
  }, [text]);

  return <Text style={styles.bubbleTextBot}>{displayed || ' '}</Text>;
}

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <Animated.View
      entering={isUser ? FadeInRight.duration(280).springify() : FadeInLeft.duration(280).springify()}
      style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}
    >
      {!isUser && <Text style={styles.botName}>RANI</Text>}
      {!isUser && message.streaming ? (
        <StreamingText text={message.content} />
      ) : (
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextBot]}>
          {message.content}
        </Text>
      )}
    </Animated.View>
  );
}

export default function RaniChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([{ ...WELCOME, id: 'welcome' }]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const listRef                 = useRef<FlatList>(null);

  const sendScale   = useSharedValue(1);
  const sendBtnAnim = useAnimatedStyle(() => ({ transform: [{ scale: sendScale.value }] }));

  const scrollToEnd = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  const send = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    sendScale.value = withSpring(0.85, { damping: 4 }, () => {
      sendScale.value = withSpring(1, { damping: 6 });
    });
    setInput('');

    const userMsg: Message = { id: `${Date.now()}-u`, role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    scrollToEnd();

    try {
      const history = [...messages.filter(m => m.id !== 'welcome'), userMsg]
        .map(({ role, content }) => ({ role, content }));

      const reply = await sendChatMessage(history);
      const botMsg: Message = {
        id: `${Date.now()}-a`,
        role: 'assistant',
        content: reply,
        streaming: true,
      };
      setMessages(prev => [...prev, botMsg]);

      setTimeout(() => {
        setMessages(prev =>
          prev.map(m => m.id === botMsg.id ? { ...m, streaming: false } : m)
        );
      }, reply.length * 12 + 200);

    } catch {
      setMessages(prev => [...prev, {
        id: `${Date.now()}-err`,
        role: 'assistant',
        content: "⚠️ Service indisponible. Vérifie ta connexion et réessaie.",
      }]);
    } finally {
      setLoading(false);
      scrollToEnd();
    }
  }, [input, loading, messages, scrollToEnd]);

  const canSend = input.trim().length > 0 && !loading;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerLeft}>
            <View style={styles.raniDot} />
            <View>
              <Text style={styles.headerTitle}>Rani IA</Text>
              <Text style={styles.headerSub}>Assistant administratif marocain</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={({ item }) => <ChatBubble message={item} />}
          contentContainerStyle={styles.list}
          onContentSizeChange={scrollToEnd}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            messages.length === 1 ? (
              <View style={styles.starters}>
                {STARTERS.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={styles.starterChip}
                    onPress={() => send(s)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.starterText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null
          }
          ListFooterComponent={
            loading ? (
              <View style={styles.typingWrap}>
                <TypingIndicator />
              </View>
            ) : null
          }
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Pose ta question…"
            placeholderTextColor={COLORS.textMuted}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => send()}
          />
          <TouchableOpacity onPress={() => send()} disabled={!canSend} activeOpacity={1}>
            <Animated.View style={[styles.sendBtn, !canSend && styles.sendBtnOff, sendBtnAnim]}>
              <Text style={styles.sendIcon}>↑</Text>
            </Animated.View>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:     { flex: 1, backgroundColor: COLORS.background },
  flex:       { flex: 1 },
  headerSafe: { backgroundColor: COLORS.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  backBtn:     { padding: 4 },
  backBtnText: { fontSize: 22, color: '#FFFFFF', fontFamily: FONTS.bold },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  raniDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4ADE80',
    shadowColor: '#4ADE80',
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  headerTitle: { fontSize: 18, fontFamily: FONTS.bold, color: '#FFFFFF', letterSpacing: -0.3 },
  headerSub:   { fontSize: 12, fontFamily: FONTS.regular, color: 'rgba(255,255,255,0.6)' },

  list: { padding: 16, paddingBottom: 8 },

  starters:    { marginBottom: 16, gap: 8 },
  starterChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E8E4DC',
  },
  starterText: { fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textSub },

  typingWrap: { paddingLeft: 4, marginBottom: 4 },

  bubble: {
    maxWidth: '82%',
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 10,
  },
  bubbleUser: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E8E4DC',
  },
  botName: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    color: COLORS.accent,
    marginBottom: 5,
    letterSpacing: 1,
  },
  bubbleText:     { fontSize: 14, lineHeight: 21 },
  bubbleTextUser: { color: '#FFFFFF', fontFamily: FONTS.regular },
  bubbleTextBot:  { color: COLORS.text, fontFamily: FONTS.regular },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E4DC',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    maxHeight: 120,
    borderWidth: 1.5,
    borderColor: '#E8E4DC',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnOff: { opacity: 0.3 },
  sendIcon:   { color: '#FFFFFF', fontSize: 20, fontFamily: FONTS.bold, marginBottom: 2 },
});
