import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Keyboard,
} from 'react-native';
import { Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { sendChatMessage, ChatMessage } from '../../src/services/ai';
import { COLORS, RADIUS } from '../../src/theme';

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

type Message = ChatMessage & { id: string };

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { ...WELCOME, id: 'welcome' },
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const listRef               = useRef<FlatList>(null);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const send = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput('');

    const userMsg: Message = { id: `${Date.now()}-u`, role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    scrollToEnd();

    try {
      // Historique sans le message welcome (id='welcome') pour ne pas polluer le contexte
      const history = [...messages.filter(m => m.id !== 'welcome'), userMsg]
        .map(({ role, content }) => ({ role, content }));

      const reply = await sendChatMessage(history);
      const botMsg: Message = { id: `${Date.now()}-a`, role: 'assistant', content: reply };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      const errMsg: Message = {
        id: `${Date.now()}-err`,
        role: 'assistant',
        content: "⚠️ Service indisponible. Vérifie ta connexion et réessaie.",
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
      scrollToEnd();
    }
  }, [input, loading, messages, scrollToEnd]);

  const renderItem = useCallback(({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
        {!isUser && <Text style={styles.botName}>Rani</Text>}
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextBot]}>
          {item.content}
        </Text>
      </View>
    );
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: 'Rani — Assistant' }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={88}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onContentSizeChange={scrollToEnd}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            loading ? (
              <View style={styles.typingBubble}>
                <ActivityIndicator size="small" color={COLORS.accent} />
                <Text style={styles.typingText}>Rani répond…</Text>
              </View>
            ) : null
          }
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
        />

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ta question…"
            placeholderTextColor={COLORS.textMuted}
            accessibilityLabel="Message à envoyer à Rani"
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => send()}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => send()}
            disabled={!input.trim() || loading}
            activeOpacity={0.8}
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  list: { padding: 16, paddingBottom: 8 },

  starters: { marginBottom: 16, gap: 8 },
  starterChip: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  starterText: { fontSize: 13, color: COLORS.textSub },

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
    backgroundColor: COLORS.surface,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  botName: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accent,
    marginBottom: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  bubbleTextUser: { color: '#fff' },
  bubbleTextBot: { color: COLORS.text },

  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    alignSelf: 'flex-start',
    borderRadius: RADIUS.lg,
    borderBottomLeftRadius: 4,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typingText: { fontSize: 13, color: COLORS.textMuted },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 120,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.35 },
  sendBtnText: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 2 },
});
