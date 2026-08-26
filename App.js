import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';

const BRAPI_TOKEN = 'stcDDjSkhEJ9F28V7yBJ1R';

// Ajuste automático de IP para Web, Emulador Android ou Dispositivo Físico
const SERVER_IP = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const API_URL = `http://${SERVER_IP}:3000/api/alertas`;

export default function App() {
  const [tickerBusca, setTickerBusca] = useState('PETR4');
  const [cotacao, setCotacao] = useState(null);
  const [loadingCotacao, setLoadingCotacao] = useState(false);

  const [ticker, setTicker] = useState('');
  const [preco, setPreco] = useState('');
  const [tipo, setTipo] = useState('COMPRA');
  
  const [alertas, setAlertas] = useState([]);
  const [loadingAlertas, setLoadingAlertas] = useState(false);

  useEffect(() => {
    buscarCotacao('PETR4');
    carregarAlertas();
  }, []);

  // 1. Cotacao direta da Brapi
  const buscarCotacao = async (simbolo) => {
    const alvo = simbolo || tickerBusca;
    if (!alvo) return;
    setLoadingCotacao(true);
    try {
      const response = await fetch(
        `https://brapi.dev/api/quote/${alvo.trim().toUpperCase()}?token=${BRAPI_TOKEN}`
      );
      const data = await response.json();
      if (data?.results?.[0]) {
        setCotacao(data.results[0]);
      } else {
        setCotacao(null);
        Alert.alert('Erro', 'Ativo não encontrado na Brapi.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao buscar cotação.');
    } finally {
      setLoadingCotacao(false);
    }
  };

  // 2. GET /api/alertas do MySQL
  const carregarAlertas = async () => {
    setLoadingAlertas(true);
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setAlertas(data);
    } catch (error) {
      console.error('Erro ao buscar alertas do MySQL:', error);
    } finally {
      setLoadingAlertas(false);
    }
  };

  // 3. POST /api/alertas no MySQL
  const criarAlerta = async () => {
    if (!ticker || !preco) {
      Alert.alert('Atenção', 'Preencha o código do ativo e o preço alvo.');
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo_ativo: ticker.trim().toUpperCase(),
          preco_alvo: parseFloat(preco.replace(',', '.')),
          tipo_alerta: tipo,
        }),
      });

      if (response.ok) {
        setTicker('');
        setPreco('');
        carregarAlertas(); // Atualiza a lista direto do banco
      } else {
        Alert.alert('Erro', 'Não foi possível salvar o alerta no MySQL.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao conectar com o servidor Node.js.');
    }
  };

  // 4. DELETE /api/alertas/:id no MySQL
  const deletarAlerta = async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (response.ok) {
        carregarAlertas();
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao excluir alerta.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F5F9" />
      <Text style={styles.headerTitle}>InvestMind</Text>

      {/* Card Cotação */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Consultar Cotação</Text>
        <View style={styles.inlineRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Ex: PETR4, VALE3"
            value={tickerBusca}
            onChangeText={setTickerBusca}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.btnSecondary} onPress={() => buscarCotacao()}>
            <Text style={styles.btnSecondaryText}>Buscar</Text>
          </TouchableOpacity>
        </View>

        {loadingCotacao ? (
          <ActivityIndicator color="#007AFF" style={{ marginTop: 12 }} />
        ) : cotacao ? (
          <View style={styles.quoteResult}>
            <View>
              <Text style={styles.symbolText}>{cotacao.symbol}</Text>
              <Text style={styles.shortNameText}>{cotacao.shortName || cotacao.longName}</Text>
            </View>
            <Text style={styles.priceText}>
              R$ {cotacao.regularMarketPrice ? cotacao.regularMarketPrice.toFixed(2) : 'N/A'}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Formulário Novo Alerta */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Novo Alerta (MySQL)</Text>
        <TextInput
          style={styles.input}
          placeholder="Código do Ativo (ex: MGLU3)"
          value={ticker}
          onChangeText={setTicker}
          autoCapitalize="characters"
        />
        <TextInput
          style={styles.input}
          placeholder="Preço Alvo (ex: 34.50)"
          value={preco}
          onChangeText={setPreco}
          keyboardType="numeric"
        />

        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeBtn, tipo === 'COMPRA' && styles.typeBtnActiveBuy]}
            onPress={() => setTipo('COMPRA')}
          >
            <Text style={[styles.typeBtnText, tipo === 'COMPRA' && styles.typeBtnTextActive]}>
              COMPRA
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, tipo === 'VENDA' && styles.typeBtnActiveSell]}
            onPress={() => setTipo('VENDA')}
          >
            <Text style={[styles.typeBtnText, tipo === 'VENDA' && styles.typeBtnTextActive]}>
              VENDA
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.btnPrimary} onPress={criarAlerta}>
          <Text style={styles.btnPrimaryText}>Cadastrar Alerta</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Alertas do MySQL */}
      <Text style={styles.sectionTitle}>Seus Alertas</Text>
      {loadingAlertas ? (
        <ActivityIndicator color="#007AFF" />
      ) : (
        <FlatList
          data={alertas}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={styles.alertCard}>
              <View>
                <View style={styles.inlineRow}>
                  <Text style={styles.alertTicker}>{item.codigo_ativo}</Text>
                  <View
                    style={[
                      styles.badge,
                      item.tipo_alerta === 'COMPRA' ? styles.badgeBuy : styles.badgeSell,
                    ]}
                  >
                    <Text style={styles.badgeText}>{item.tipo_alerta}</Text>
                  </View>
                </View>
                <Text style={styles.alertPrice}>
                  Alvo: R$ {parseFloat(item.preco_alvo).toFixed(2)}
                </Text>
                <Text style={styles.alertStatus}>Status: {item.status}</Text>
              </View>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => deletarAlerta(item.id)}
              >
                <Text style={styles.deleteBtnText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F5F9', paddingHorizontal: 16, paddingTop: 16 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1C1C1E', marginBottom: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1C1C1E', marginBottom: 12 },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1C1C1E',
    marginBottom: 10,
  },
  btnSecondary: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
  },
  btnSecondaryText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  quoteResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  symbolText: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  shortNameText: { fontSize: 12, color: '#8E8E93' },
  priceText: { fontSize: 18, fontWeight: '600', color: '#34C759' },
  typeSelector: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  typeBtnActiveBuy: { backgroundColor: '#34C759' },
  typeBtnActiveSell: { backgroundColor: '#FF3B30' },
  typeBtnText: { fontWeight: '600', color: '#8E8E93' },
  typeBtnTextActive: { color: '#FFF' },
  btnPrimary: {
    backgroundColor: '#1C1C1E',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#FFF', fontWeight: '600', fontSize: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', marginBottom: 10 },
  alertCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTicker: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  alertPrice: { fontSize: 14, color: '#3A3A3C', marginTop: 4 },
  alertStatus: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginLeft: 8 },
  badgeBuy: { backgroundColor: '#E8F8EF' },
  badgeSell: { backgroundColor: '#FEECEB' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  deleteBtn: { backgroundColor: '#FEECEB', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  deleteBtnText: { color: '#FF3B30', fontWeight: '600', fontSize: 13 },
});