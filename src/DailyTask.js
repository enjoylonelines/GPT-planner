import React from 'react';
import './App.css';
// DailyTask 컴포넌트는 특정 날짜에 대한 할일 리스트를 표시하는 역할을 합니다.

function DailyTask({ daily }) {

  return (
    <div>
      <p>Date: {daily.date}</p>
      <p>Subject: {daily.subject}</p>
      <p>Time: {daily.time}</p>
      <p>Page: {daily.page}</p>
    </div>
  );
}

export default DailyTask;

