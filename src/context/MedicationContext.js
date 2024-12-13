import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const MedicationContext = createContext();

export const MedicationProvider = ({ children }) => {
  const [medications, setMedications] = useState([]);
  const [history, setHistory] = useState({});
  const [notificationsEnabled, setNotificationsEnabled] = useState(true); // 알림 On/Off 상태

  // 데이터를 AsyncStorage에서 불러오기
  const loadData = async () => {
    try {
      const storedMedications = await AsyncStorage.getItem('medications');
      const storedHistory = await AsyncStorage.getItem('history');
      const storedNotificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');

      setMedications(storedMedications ? JSON.parse(storedMedications) : []);
      setHistory(storedHistory ? JSON.parse(storedHistory) : {});
      setNotificationsEnabled(storedNotificationsEnabled ? JSON.parse(storedNotificationsEnabled) : true);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  // 데이터를 AsyncStorage에 저장하기
  const saveData = async () => {
    try {
      await AsyncStorage.setItem('medications', JSON.stringify(medications));
      await AsyncStorage.setItem('history', JSON.stringify(history));
      await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(notificationsEnabled));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };

  // 날짜별 History 업데이트 함수
  const updateHistoryForDate = (date, status) => {
    setHistory((prev) => ({
      ...prev,
      [date]: { status },
    }));
  };

  // 약 추가 함수
  const addMedication = ({ name, period, dosePerDay, stock, reminderTimes }) => {
    const today = new Date().toISOString().split('T')[0];
    const [startDate] = period.split(' ~ '); // 복용 시작일 추출
  
    const initializedTimes = reminderTimes.map((time) => ({
      time,
      taken: false,
    }));
  
    setMedications((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name,
        period,
        dosePerDay,
        stock,
        reminderTimes: initializedTimes,
        notificationsEnabled: true,
      },
    ]);
  
    if (startDate === today) {
      updateHistoryForDate(today, 'X'); // 복용 시작일이 오늘인 경우만 History에 추가
    }
  };
  

  // 약 복용 상태 토글 함수 (전체 복용 상태)
  const toggleMedicationStatus = (id) => {
    const today = new Date().toISOString().split('T')[0];

    setMedications((prev) =>
      prev.map((med) => {
        if (med.id === id) {
          const updatedTaken = !med.taken;
          const status = updatedTaken ? 'O' : 'X';
          updateHistoryForDate(today, status);
          return { ...med, taken: updatedTaken };
        }
        return med;
      })
    );
  };

  const toggleTimeTakenStatus = (medicationId, time) => {
    const today = new Date().toISOString().split('T')[0];
  
    setMedications((prev) =>
      prev.map((med) => {
        if (med.id === medicationId) {
          // 복용 시간별 taken 상태 업데이트
          const updatedTimes = med.reminderTimes.map((reminder) =>
            reminder.time === time ? { ...reminder, taken: !reminder.taken } : reminder
          );
  
          // 복용 완료 시 재고 감소 및 복용 취소 시 재고 복구
          const totalTakenBefore = med.reminderTimes.filter((r) => r.taken).length;
          const totalTakenAfter = updatedTimes.filter((r) => r.taken).length;
  
          const stockChange = totalTakenAfter - totalTakenBefore; // 복용 완료/취소에 따른 변화량
          const newStock = Math.max(0, med.stock - stockChange); // 재고는 0보다 작아질 수 없음
  
          // 모든 복용 시간이 완료되었는지 확인
          const allTimesTaken = updatedTimes.every((reminder) => reminder.taken);
          updateHistoryForDate(today, allTimesTaken ? 'O' : 'X'); // History 업데이트
  
          // 새로운 약 상태 반환
          return { ...med, reminderTimes: updatedTimes, stock: newStock };
        }
        return med;
      })
    );
  };
  
  
  const updateHistoryForToday = () => {
    const today = new Date().toISOString().split('T')[0];
    const allTaken = medications.every((med) =>
      med.reminderTimes.every((reminder) => reminder.taken)
    );
    const status = allTaken ? 'O' : 'X';
    updateHistoryForDate(today, status);
  };

  // 알림 On/Off 토글 함수 (약별)
  const toggleMedicationNotification = (id) => {
    setMedications((prev) =>
      prev.map((med) =>
        med.id === id ? { ...med, notificationsEnabled: !med.notificationsEnabled } : med
      )
    );
  };

  // 약 제거 함수
  const removeMedication = (id) => {
    setMedications((prev) => prev.filter((med) => med.id !== id));
  };

  // 전체 알림 활성화/비활성화 토글 함수
  const toggleNotifications = () => {
    setNotificationsEnabled((prev) => !prev);
  };

  // 데이터 로드 및 저장 효과
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => saveData(), 500); // 데이터 저장 주기 최적화
    return () => clearTimeout(timer);
  }, [medications, history, notificationsEnabled]);

  return (
    <MedicationContext.Provider
      value={{
        medications,
        history,
        notificationsEnabled,
        toggleNotifications,
        addMedication,
        toggleMedicationStatus,
        toggleMedicationNotification,
        removeMedication,
        updateHistoryForDate,
        toggleTimeTakenStatus,
        updateHistoryForToday,
      }}
    >
      {children}
    </MedicationContext.Provider>
  );
};
