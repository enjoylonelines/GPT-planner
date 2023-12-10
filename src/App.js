import React from 'react';
import './App.css';
import DailyTask from './DailyTask';
import useTaskData from './useTaskData';


const App = () => {
  
  const { dailyTasks, loading, error, searchText, setSearchText, fetchData } = useTaskData();

  const handleButtonClick = () => {
    fetchData(); // 검색 버튼 클릭 시 fetchData 호출
  };

  if (loading) return <p>로딩 중...</p>;
  if (error) return <p>오류: {error.message}</p>;


  const groupedTasks = dailyTasks.reduce((groups, task) => {
    const date = task.date;
    
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(task);
    return groups;
  }, {});

  return (
    <div className="App">
      <div className='black-nav'>
        <div>GPT PLANNER</div>
      </div>

      <h1>December 2023</h1>

      <header className="search-bar">
        <input
          type="text"
          placeholder="plan을 입력하세요"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
           <button onClick={handleButtonClick}>검색</button>
        </header>

      <div className='tasks-group'>
      {Object.entries(groupedTasks).map(([date, tasks]) => (
          <div key={date} className="daily-group">
            <h2>{date}</h2>
            {tasks.map((task) => (
              <DailyTask key={task.daily_id} daily={task} />
            ))}
          </div>
          
       ))}
      </div>
      
    </div>
  );
};

export default App;

