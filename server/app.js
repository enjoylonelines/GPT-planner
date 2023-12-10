const express = require("express");
const app = express();
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const port = 3001;
const { pool, openaiApiKey } = require("./pool");
const bodyParser = require("body-parser");

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.post("/tasks", (req, res) => {
  const messages = req.body;

  const functions = [
    {
      name: "study_planner",
      description: "스터디 플랜 작성",
      parameters: {
        type: "object",
        properties: {
          user_id: {
            type: "string",
            description: "유저의 아이디 찾기",
          },
          user_name: {
            type: "string",
            description: "유저의 이름 찾기",
          },
          subject_data: {
            type: "array",
            description: "시험 과목 정보",
            items: {
              type: "object",
              properties: {
                subject_id: { type: "string", description: "과목 이름" },
                exam_date: { type: "string", description: "시험 날짜" },
              },
              required: ["subject_id", "exam_date"],
            },
          },
          plan_data: {
            type: "array",
            description: "계획된 플랜 정보",
            items: {
              type: "object",
              properties: {
                date: {
                  type: "string",
                  description: "오늘 날짜부터 시험까지의 날짜",
                },
                time: { type: "string", description: "과목당 하루 공부 시간" },
                sub: { type: "string", description: "공부하는 과목 이름" },
                page: {
                  type: "string",
                  description: "시험 날짜 전까지 계획된 하루 공부 페이지",
                },
              },
              required: ["date", "time", "sub", "page"],
            },
          },
        },
        required: ["user_id", "user_name", "subject_data", "plan_data"],
      },
    },
  ];

  axios
    .post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo-0613",
        messages: messages,
        functions: functions,
        function_call: "auto",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
      }
    )
    .then((response) => {
      const functionCallResult =
        response.data.choices[0].message.function_call.arguments;
      console.log(functionCallResult);
      const data = JSON.parse(functionCallResult);

      pool.getConnection((err, conn) => {
        if (err) {
          console.error("Mysql connection error: " + err);
          res.status(500).json({ error: "Internal Server Error" });
          return;
        }
        // 정보 삽입
        const userQuery = `INSERT INTO user_table (user_id, user_name) VALUES (?, ?)`;
        conn.query(
          userQuery,
          [data.user_id, data.user_name],
          (err, result1) => {
            if (err) {
              console.log("SQL 실행시 오류 발생1");
              console.dir(err); // 에러 세부정보 출력
              return;
            }
            if (result1) {
              console.dir(result1);
              console.log("첫번째 Inserted 성공");
            } else {
              console.log("Inserted 실패1");
            }

            const planQuery = `INSERT INTO plan_table (user_id) VALUES (?)`;
            conn.query(planQuery, [data.user_id], (err, result2) => {
              if (err) {
                console.log("SQL 실행시 오류 발생2");
                console.dir(err);
                return;
              }
              if (result2) {
                console.dir(result2);
                console.log("두번째 Inserted 성공");
              } else {
                console.log("Inserted 실패2");
              }

              // result.insetID -> plan
              const subjectQuery = `INSERT INTO subject_table (subject_id, plan_id, exam_date) VALUES ?`;
              const subjectValues = data.subject_data.map((subject) => [
                subject.subject_id,
                result2.insertId,
                subject.exam_date,
              ]);
              conn.query(subjectQuery, [subjectValues], (err, result3) => {
                if (err) {
                  console.log("SQL 실행시 오류 발생3");
                  console.dir(err);
                  return;
                }
                if (result3) {
                  console.dir(result3);
                  console.log("세 번째 Inserted 성공");
                } else {
                  console.log("Inserted 실패3");
                }

                // result.insetID -> plan
                const dailyQuery = `INSERT INTO daily_table (plan_id, date, subject, time, page) VALUES ?`;
                const dailyValues = data.plan_data.map((plan) => [
                  result2.insertId,
                  plan.date,
                  plan.sub,
                  plan.time,
                  plan.page,
                ]);
                conn.query(dailyQuery, [dailyValues], (err, result4) => {
                  if (err) {
                    console.log("SQL 실행시 오류 발생4");
                    console.dir(err);
                    return;
                  }
                  if (result4) {
                    console.dir(result4);
                    console.log("네 번째 Inserted 성공");
                  } else {
                    console.log("Inserted 실패4");
                  }
                  conn.release();
                });
              });
            });
          }
        ); // query 메서드로 질의
      });
    })
    .catch((error) => {
      console.error(error.message);
    });

  const query = "SELECT * FROM daily_table";

  pool.getConnection((err, conn) => {
    if (err) {
      console.error("Mysql connection error: " + err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    conn.query(query, (err, result) => {
      if (err) {
        console.error("Error executing query:", err);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }

      res.json(result); // 데이터를 JSON 형식으로 응답
      conn.release(); // 연결 해제
    });
  });
});
