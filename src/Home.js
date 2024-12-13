import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import * as Notifications from 'expo-notifications';
import { MedicationContext } from './context/MedicationContext';

// 알림 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function Medication() {
  const { addMedication } = useContext(MedicationContext);
  const [name, setName] = useState('');
  const [selectedDates, setSelectedDates] = useState({ start: null, end: null });
  const [reminderTimes, setReminderTimes] = useState([]);
  const [currentReminder, setCurrentReminder] = useState('');
  const [dosePerDay, setDosePerDay] = useState('');
  const [stock, setStock] = useState('');

  useEffect(() => {
    const registerForPushNotificationsAsync = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert('알림 권한이 필요합니다.');
        }
      }
    };

    registerForPushNotificationsAsync();
  }, []);

  const handleDayPress = (day) => {
    if (!selectedDates.start || (selectedDates.start && selectedDates.end)) {
      setSelectedDates({ start: day.dateString, end: null });
    } else {
      setSelectedDates((prev) => ({
        ...prev,
        end: day.dateString,
      }));
    }
  };

  const addReminderTime = () => {
    if (!currentReminder.trim()) {
      Alert.alert('복용 시간을 입력하세요!');
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(currentReminder)) {
      Alert.alert('시간 형식이 올바르지 않습니다. 예: 08:00');
      return;
    }
    setReminderTimes((prev) => [...prev, currentReminder]);
    setCurrentReminder('');
  };

  const removeReminderTime = (time) => {
    setReminderTimes((prev) => prev.filter((t) => t !== time));
  };

  const generateReminderTimes = () => {
    if (!dosePerDay || isNaN(dosePerDay) || dosePerDay <= 0) {
      Alert.alert('올바른 복용 횟수를 입력하세요!');
      return;
    }

    const times = [];
    const interval = Math.floor(24 / dosePerDay);

    for (let i = 0; i < dosePerDay; i++) {
      const hour = (i * interval).toString().padStart(2, '0');
      times.push(`${hour}:00`);
    }

    setReminderTimes(times);
  };

  const scheduleNotification = async (name, date, time) => {
    const [hour, minute] = time.split(':').map(Number);
    const notificationDate = new Date(date);
    notificationDate.setHours(hour);
    notificationDate.setMinutes(minute);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '약 복용 알림',
        body: `${name}을(를) 복용할 시간입니다.`,
      },
      trigger: notificationDate,
    });
  };

  const handleAddMedication = async () => {
    if (!name.trim()) {
      Alert.alert('약 이름을 입력하세요!');
      return;
    }
    if (!selectedDates.start || !selectedDates.end) {
      Alert.alert('복용 시작일과 종료일을 선택하세요!');
      return;
    }
    if (!dosePerDay || isNaN(dosePerDay) || dosePerDay <= 0) {
      Alert.alert('올바른 복용 횟수를 입력하세요!');
      return;
    }
    if (!stock || isNaN(stock) || stock <= 0) {
      Alert.alert('재고를 입력하세요!');
      return;
    }

    addMedication({
      name,
      period: `${selectedDates.start} ~ ${selectedDates.end}`,
      dosePerDay: parseInt(dosePerDay),
      stock: parseInt(stock),
      reminderTimes,
    });

    let currentDate = new Date(selectedDates.start);
    const endDate = new Date(selectedDates.end);

    while (currentDate <= endDate) {
      for (const time of reminderTimes) {
        await scheduleNotification(name, currentDate.toISOString().split('T')[0], time);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    Alert.alert('약이 추가되었습니다!');
    setName('');
    setSelectedDates({ start: null, end: null });
    setReminderTimes([]);
    setDosePerDay('');
    setStock('');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>새로운 약 추가</Text>
        <TextInput
          style={styles.input}
          placeholder="약 이름 입력"
          value={name}
          onChangeText={setName}
        />
        <Text style={styles.subTitle}>복용 기간 선택</Text>
        <Calendar
          markedDates={{
            ...(selectedDates.start && { [selectedDates.start]: { selected: true, selectedColor: 'blue' } }),
            ...(selectedDates.end && { [selectedDates.end]: { selected: true, selectedColor: 'blue' } }),
          }}
          onDayPress={handleDayPress}
        />
        {selectedDates.start && selectedDates.end && (
          <Text style={styles.periodText}>
            복용 기간: {selectedDates.start} ~ {selectedDates.end}
          </Text>
        )}
        <TextInput
          style={styles.input}
          placeholder="하루 복용 횟수 (예: 3)"
          value={dosePerDay}
          onChangeText={setDosePerDay}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="재고량 입력 (예: 30)"
          value={stock}
          onChangeText={setStock}
          keyboardType="numeric"
        />
        <View>
          <Text style={styles.subTitle}>복용 시간 추가</Text>
          <TextInput
            style={styles.input}
            placeholder="예: 08:00"
            value={currentReminder}
            onChangeText={setCurrentReminder}
          />
          <Button title="시간 추가" onPress={addReminderTime} />
        </View>
        <FlatList
          data={reminderTimes}
          keyExtractor={(item, index) => `${item}-${index}`}
          renderItem={({ item }) => (
            <View style={styles.timeItem}>
              <Text>{item}</Text>
              <TouchableOpacity onPress={() => removeReminderTime(item)}>
                <Text style={styles.deleteButton}>X</Text>
              </TouchableOpacity>
            </View>
          )}
        />
        <Button title="약 추가" onPress={handleAddMedication} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  subTitle: { fontSize: 18, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 20, borderRadius: 5 },
  periodText: { fontSize: 16, color: 'green', marginVertical: 10, textAlign: 'center' },
  timeItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderBottomWidth: 1, borderColor: '#ccc' },
  deleteButton: { color: 'red', fontWeight: 'bold' },
});
