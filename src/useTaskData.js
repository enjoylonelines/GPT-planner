import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useTaskData = () => {
  const [dailyTasks, setDailyTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");

  const fetchData = useCallback(async () => {
    try {

      const messages = [
        {
          role: "system",
          content:
            "스터디 플랜을 더 잘 세우도록 도와드리겠습니다. 추가 정보를 제공해 주세요.",
        },
        { role: "user", content: `${searchText}` },
      ];
     
      const response = await axios.post('http://localhost:3001/tasks', messages );

      const formattedTasks = response.data.map((task) => ({
        ...task,
        date: new Date(task.date).toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
        }),
      }));
      setDailyTasks(formattedTasks);

      setLoading(false);
    } catch (error) {
      setError(error);
      setLoading(false);
    }
  }, [searchText]);

  useEffect(() => {
    // 최초 렌더링 시에만 실행되도록 체크
    if (searchText !== "") {
      fetchData();
    }
  }, []);

  return { dailyTasks, loading, error, searchText, setSearchText, fetchData };
};

export default useTaskData;
