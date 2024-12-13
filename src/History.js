import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { MedicationContext } from './context/MedicationContext';

export default function History() {
  const { history, medications } = useContext(MedicationContext); // MedicationContext에서 데이터 가져오기
  const [selectedDate, setSelectedDate] = useState(null); // 선택된 날짜 상태

  // 캘린더 표시용 데이터
  const markedDates = Object.keys(history).reduce((acc, date) => {
    acc[date] = {
      marked: true,
      dotColor: history[date].status === 'O' ? 'green' : 'red',
    };
    return acc;
  }, {});

  // 날짜별 복용/미복용 약물 리스트 생성
  const getMedicationStatusForDate = (date) => {
    const medsForDate = medications.map((med) => {
      const takenTimes = med.reminderTimes
        .filter((time) => time.taken && history[date]) // 해당 날짜에서 복용 완료
        .map((time) => `${med.name}-${time.time}`);

      const missedTimes = med.reminderTimes
        .filter((time) => !time.taken && history[date]) // 해당 날짜에서 미복용
        .map((time) => `${med.name}-${time.time}`);

      return { taken: takenTimes, missed: missedTimes };
    });

    // 결과를 합산하여 하나의 리스트로 반환
    const taken = medsForDate.flatMap((item) => item.taken);
    const missed = medsForDate.flatMap((item) => item.missed);
    return { taken, missed };
  };

  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  const selectedStatus = selectedDate ? getMedicationStatusForDate(selectedDate) : { taken: [], missed: [] };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>복약 기록</Text>
      <Calendar
        markedDates={markedDates}
        onDayPress={handleDayPress}
        style={styles.calendar}
        theme={{
          todayTextColor: 'blue',
          arrowColor: 'blue',
          dotColor: 'green',
          selectedDayBackgroundColor: '#f0f0f0',
        }}
      />
      {selectedDate && (
        <View style={styles.detail}>
          <Text style={styles.detailTitle}>선택한 날짜: {selectedDate}</Text>
          {selectedStatus.taken.length > 0 ? (
            <Text style={styles.detailText}>
              복용: {selectedStatus.taken.join(', ')}
            </Text>
          ) : (
            <Text style={styles.detailText}>복용: 없음</Text>
          )}
          {selectedStatus.missed.length > 0 ? (
            <Text style={styles.detailText}>
              미복용: {selectedStatus.missed.join(', ')}
            </Text>
          ) : (
            <Text style={styles.detailText}>미복용: 없음</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  calendar: { borderRadius: 10, elevation: 4 },
  detail: {
    marginTop: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
  },
  detailTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  detailText: { fontSize: 16, color: '#333', marginBottom: 5 },
});
