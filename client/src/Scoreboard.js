import React from 'react';
import { Layout, message, Table, Avatar } from 'antd';
import {
  FileUnknownTwoTone
} from '@ant-design/icons';
import './App.min.css';
import { orderBy } from "lodash";
import { AreaChart, Area, Tooltip, XAxis, YAxis, CartesianGrid, Label, ResponsiveContainer } from "recharts";
import { Ellipsis, Ripple } from 'react-spinners-css';
import { Link } from 'react-router-dom';

const { Column } = Table;

var finalScores = []
var changes = []
var updating = false

class Scoreboard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      scores: [],
      graphData: [{ "": 0 }],
      top10: [""] * 10,
      loadingGraph: false,
      loadingTable: false,
      liveUpdates: false,
    };
  }

  componentDidMount = async () => {
    let scoreboardData = sessionStorage.getItem("scoreboard-data")
    if (scoreboardData === null) {
      [finalScores, changes] = await Promise.all([this.getFinalScores(), this.getChanges()])
      sessionStorage.setItem("scoreboard-data", JSON.stringify({ finalScores: finalScores, changes: changes }))
    }
    else {
      scoreboardData = JSON.parse(scoreboardData)
      finalScores = scoreboardData.finalScores
      changes = scoreboardData.changes
    }
    // Render whatever data we have either: stored in sessionStorage/retrieved from Fetch for fast loading of scoreboard
    this.sortPlotRenderData(JSON.parse(JSON.stringify(changes)), JSON.parse(JSON.stringify(finalScores)).scores)

    this.connectWebSocket() //Connect to socket server for live scoreboard and this will update the scoreboard with the latest data

    //Update last solved timing
    setInterval(() => {this.lastSolveTiming()}, 60 * 1000)

  }

  lastSolveTiming() {
    if (!updating) {
      let scoreArray = this.state.scores
      for (let x = 0; x < scoreArray.length; x++) {

        if ("timestamp" in scoreArray[x] && scoreArray[x].timestamp !== "0") {
          //console.log(scoreArray[x])
          scoreArray[x].position = String(x + 1) + "."
          const dateTime = Math.abs(new Date() - new Date(scoreArray[x].timestamp)) / 1000 //no. of seconds since the challenge was completed/hint bought
          let minutes = Math.ceil(dateTime / 60)
          let hours = 0
          let days = 0
          let months = 0
          let years = 0
          if (minutes >= 60) {
            hours = Math.floor(minutes / 60)
            minutes = minutes - hours * 60

            if (hours >= 24) {
              days = Math.floor(hours / 24)
              hours = hours - days * 24

              if (days >= 30) {
                months = Math.floor(days / 30)
                days = days - months * 30

                if (months >= 12) {
                  years = Math.floor(months / 12)
                  months = months - years * 12
                }
              }
            }
          }
          let finalTime = " ago."
          if (minutes !== 0) {
            finalTime = minutes.toString() + (minutes > 1 ? " minutes " : " minute ") + finalTime
          }
          if (hours !== 0) {
            finalTime = hours.toString() + (hours > 1 ? " hours " : " hour ") + finalTime
          }
          if (days !== 0) {
            finalTime = days.toString() + (days > 1 ? " days " : " day ") + finalTime
          }
          if (months !== 0) {
            finalTime = months.toString() + (months > 1 ? " months " : " month ") + finalTime
          }
          if (years !== 0) {
            finalTime = years.toString() + (years > 1 ? " years " : " year ") + finalTime
          }
          scoreArray[x].time = finalTime

        }
        else {
          scoreArray[x].timestamp = "No solves yet"
        }
      }
      this.setState({ scores: scoreArray })
    }
  }

  connectWebSocket() {
    let webSocket = new WebSocket(window.production ? "wss://api.irscybersec.tk" : "ws://localhost:20001")
    webSocket.onmessage = (e) => {
      let data = JSON.parse(e.data)
      if (data.type === "score") {
        updating = true
        const payload = data.data
        let found = false
        for (let i = 0; i < finalScores.scores.length; i++) {
          if (finalScores.scores[i].username === payload.username) {

            finalScores.scores[i].score += payload.points
            found = true
            break
          }
        }

        if (found) {
          for (let x = 0; x < changes.users.length; x++) {
            if (changes.users[x]._id === payload.username) {
              changes.users[x].changes.push({ points: payload.points, timestamp: payload.timestamp })
              break
            }
          }
        }
        else {
          // User is a new user not on the scoreboard for whatever reason
          finalScores.scores.push({ username: payload.username, score: payload.points })
          changes.users.push({ _id: payload.username, changes: [{ points: payload.points, timestamp: payload.timestamp }] })
        }

        this.sortPlotRenderData(JSON.parse(JSON.stringify(changes)), JSON.parse(JSON.stringify(finalScores)).scores)
      }
      else if (data.type === "init") {
        if (data.data === "bad-auth") message.error("Error connecting to live updates")
        else if (data.data === "missing-auth") message.error("Error connecting to live updates")
        else if (data.data === "up-to-date") this.setState({ liveUpdates: true })
        else {
          for (let y = 0; y < data.data.length; y++) {
            const payload = data.data[y]
            let found = false
            for (let i = 0; i < finalScores.scores.length; i++) {
              if (finalScores.scores[i].username === payload.author) {

                finalScores.scores[i].score += payload.points
                found = true
                break
              }
            }

            if (found) {
              for (let x = 0; x < changes.users.length; x++) {
                if (changes.users[x]._id === payload.author) {
                  changes.users[x].changes.push({ points: payload.points, timestamp: payload.timestamp })
                  break
                }
              }
            }
            else {
              // User is a new user not on the scoreboard for whatever reason
              finalScores.scores.push({ username: payload.author, score: payload.points })
              changes.users.push({ _id: payload.author, changes: [{ points: payload.points, timestamp: payload.timestamp }] })
            }
          }


          this.sortPlotRenderData(JSON.parse(JSON.stringify(changes)), JSON.parse(JSON.stringify(finalScores)).scores)

          sessionStorage.setItem("scoreboard-data", JSON.stringify({ finalScores: finalScores, changes: changes }))
          sessionStorage.setItem("lastChallengeID", data.lastChallengeID.toString())
          this.setState({ liveUpdates: true })
        }
      }
    }
    webSocket.onopen = (e) => {
      const ID = sessionStorage.getItem("lastChallengeID")
      webSocket.send(JSON.stringify({ type: "init", data: { auth: localStorage.getItem("IRSCTF-token"), lastChallengeID: parseInt(ID) } }))
    }
    webSocket.onerror = (e) => {
      console.error(e)
    }
    webSocket.onclose = (e) => {
      this.setState({ liveUpdates: false })
      console.log('Socket closed. Attempting to reconnect in 1.5 seconds', e.reason);
      setTimeout(() => { this.connectWebSocket() }, 1500)
    };
  }

  sortPlotRenderData(data, scoreArray) {

    let formattedData = []
    let finalPoint = {}
    let timestamp = {}

    for (let i = 0; i < data.users.length; i++) {
      //Process timestamps - sort by the latest date
      let scores2 = data.users[i].changes

      for (let x = 0; x < scores2.length; x++) {
        if (data.users[i]._id in timestamp) {
          let d1 = new Date(timestamp[data.users[i]._id])
          let d2 = new Date(scores2[x].timestamp)
          if (d1 < d2 && scores2[x].points > 0) timestamp[data.users[i]._id] = scores2[x].timestamp
        }
        else timestamp[data.users[i]._id] = scores2[x].timestamp
      }
    }

    //console.log(timestamp)
    // More processing & sort by timestamp
    for (let x = 0; x < scoreArray.length; x++) {
      if (scoreArray[x].username in timestamp) {
        scoreArray[x].timestamp = timestamp[scoreArray[x].username]
      }
      else {
        scoreArray[x].timestamp = "0"
      }
    }
    scoreArray = orderBy(scoreArray, ["score", "timestamp"], ["desc", "asc"])

    // Plot graph data and get top 10 scores
    let top10scores = {}
    let top10 = []
    const iterateTill = scoreArray.length > 10 ? 10 : scoreArray.length
    for (let i = 0; i < iterateTill; i++) {
      top10scores[scoreArray[i].username] = scoreArray[i].score
      top10.push(scoreArray[i].username)
    }

    finalPoint = top10scores
    finalPoint["Time"] = new Date().toLocaleString("en-US", { timeZone: "Asia/Singapore" })
    for (let i = 0; i < data.users.length; i++) {
      let currentPoint = {}

      if (data.users[i]._id in top10scores) {
        let scores = data.users[i].changes
        let pointsSoFar = 0

        for (let x = 0; x < scores.length; x++) {

          pointsSoFar += scores[x].points
          currentPoint["name"] = data.users[i]._id
          currentPoint["points"] = pointsSoFar
          currentPoint["Time"] = scores[x].timestamp
          formattedData.push(Object.assign({}, currentPoint))
        }

      }
    }

    for (let x = 0; x < scoreArray.length; x++) {

      if ("timestamp" in scoreArray[x] && scoreArray[x].timestamp !== "0") {
        //console.log(scoreArray[x])
        scoreArray[x].position = String(x + 1) + "."
        const dateTime = Math.abs(new Date() - new Date(scoreArray[x].timestamp)) / 1000 //no. of seconds since the challenge was completed/hint bought
        let minutes = Math.ceil(dateTime / 60)
        let hours = 0
        let days = 0
        let months = 0
        let years = 0
        if (minutes >= 60) {
          hours = Math.floor(minutes / 60)
          minutes = minutes - hours * 60

          if (hours >= 24) {
            days = Math.floor(hours / 24)
            hours = hours - days * 24

            if (days >= 30) {
              months = Math.floor(days / 30)
              days = days - months * 30

              if (months >= 12) {
                years = Math.floor(months / 12)
                months = months - years * 12
              }
            }
          }
        }
        let finalTime = " ago."
        if (minutes !== 0) {
          finalTime = minutes.toString() + (minutes > 1 ? " minutes " : " minute ") + finalTime
        }
        if (hours !== 0) {
          finalTime = hours.toString() + (hours > 1 ? " hours " : " hour ") + finalTime
        }
        if (days !== 0) {
          finalTime = days.toString() + (days > 1 ? " days " : " day ") + finalTime
        }
        if (months !== 0) {
          finalTime = months.toString() + (months > 1 ? " months " : " month ") + finalTime
        }
        if (years !== 0) {
          finalTime = years.toString() + (years > 1 ? " years " : " year ") + finalTime
        }
        scoreArray[x].time = finalTime

      }
      else {
        scoreArray[x].timestamp = "No solves yet"
      }
    }


    formattedData = orderBy(formattedData, ["Time"], ["asc"])
    //console.log(formattedData)
    let pointDict = {}
    let finalData = []

    for (let i = 0; i < formattedData.length; i++) {

      pointDict[formattedData[i].name] = formattedData[i].points
      pointDict["Time"] = new Date(formattedData[i].Time).toLocaleString("en-US", { timeZone: "Asia/Singapore" })

      let copy = Object.assign({}, pointDict)

      finalData.push(copy)
    }

    finalData.push(finalPoint)
    this.setState({ graphData: finalData, loadingGraph: false, scores: scoreArray, loadingTable: false, top10: top10 })
    updating = false
  }

  getFinalScores = async () => {
    this.setState({ loadingGraph: true, loadingTable: true })
    const finalData = await fetch(window.ipAddress + "/v1/scores", {
      method: 'get',
      headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
    }).then((results) => {
      return results.json(); //return data in JSON (since its JSON data)
    }).then((data) => {

      if (data.success) {
        return data
      }
      else {
        message.error({ content: "Oops. Unknown error" })
      }


    }).catch((error) => {
      message.error({ content: "Oops. There was an issue connecting with the server" });
    })
    return finalData
  }


  getChanges = async () => {
    const finalData = await fetch(window.ipAddress + "/v1/scoreboard", {
      method: 'get',
      headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
    }).then((results) => {
      return results.json(); //return data in JSON (since its JSON data)
    }).then((data) => {
      if (data.success === true) {
        sessionStorage.setItem("lastChallengeID", data.lastChallengeID)
        return data
      }
      else {
        message.error({ content: "Oops. Unknown error" })
      }


    }).catch((error) => {
      console.log(error)
      message.error({ content: "Oops. There was an issue connecting with the server" });
    })
    return finalData
  }






  render() {
    return (
      <Layout className="layout-style">
        <div style={{ height: 375, width: "100%", backgroundColor: "rgba(0, 0, 0, 0.3)", border: "5px solid transparent", borderRadius: "20px", padding: "10px", margin: "10px" }}>
          <ResponsiveContainer width="90%" height={350} debounce={200}>
            <AreaChart height={350} data={this.state.graphData}

              margin={{ top: 10, right: 15, left: 15, bottom: 15 }}>

              <defs>
                <linearGradient id="color1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#791a1f" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f89f9a" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="color2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c4a15" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f8cf8d" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="color3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c5914" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f8df8b" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="color4" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#536d13" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#e4f88b" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="color5" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#306317" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#b2e58b" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="color6" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#146262" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#84e2d8" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="color7" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#164c7e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8dcff8" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="color8" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#203175" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a8c1f8" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="color9" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3e2069" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#cda8f0" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="color10" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#75204f" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f8a8cc" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <XAxis dataKey="Time">
                <Label offset={-5} position="insideBottom" style={{ fill: 'rgba(207, 207, 207, 1)' }}>
                  Time
                </Label>
              </XAxis>
              <YAxis >
                <Label offset={-10} position='insideLeft' style={{ fill: 'rgba(207, 207, 207, 1)' }}>
                  Score
                </Label>
              </YAxis>
              <CartesianGrid strokeDasharray="3 3" />

              <Tooltip labelStyle={{ backgroundColor: "#1c2b3e" }} contentStyle={{ backgroundColor: "#1c2b3e" }} wrapperStyle={{ backgroundColor: "#1c2b3e" }} />
              <Area isAnimationActive={false} type="monotone" dataKey={this.state.top10[0]} stroke="#d32029" fillOpacity={1} fill="url(#color1)" />
              <Area isAnimationActive={false} type="monotone" dataKey={this.state.top10[1]} stroke="#d87a16" fillOpacity={1} fill="url(#color2)" />
              <Area isAnimationActive={false} type="monotone" dataKey={this.state.top10[2]} stroke="#d89614" fillOpacity={1} fill="url(#color3)" />
              <Area isAnimationActive={false} type="monotone" dataKey={this.state.top10[3]} stroke="#8bbb11" fillOpacity={1} fill="url(#color4)" />
              <Area isAnimationActive={false} type="monotone" dataKey={this.state.top10[4]} stroke="#49aa19" fillOpacity={1} fill="url(#color5)" />
              <Area isAnimationActive={false} type="monotone" dataKey={this.state.top10[5]} stroke="#13a8a8" fillOpacity={1} fill="url(#color6)" />
              <Area isAnimationActive={false} type="monotone" dataKey={this.state.top10[6]} stroke="#177ddc" fillOpacity={1} fill="url(#color7)" />
              <Area isAnimationActive={false} type="monotone" dataKey={this.state.top10[7]} stroke="#2b4acb" fillOpacity={1} fill="url(#color8)" />
              <Area isAnimationActive={false} type="monotone" dataKey={this.state.top10[8]} stroke="#642ab5" fillOpacity={1} fill="url(#color9)" />
              <Area isAnimationActive={false} type="monotone" dataKey={this.state.top10[9]} stroke="#cb2b83" fillOpacity={1} fill="url(#color10)" />
              <Area isAnimationActive={false} type="monotone" dataKey="Hi" stroke="#8884d8" fillOpacity={1} fill="url(#colorPv)" />
            </AreaChart>
          </ResponsiveContainer>
          {this.state.loadingGraph && (
            <div style={{ position: "absolute", left: "55%", transform: "translate(-55%, 0%)", zIndex: 10 }}>
              <Ellipsis color="#177ddc" size={120} ></Ellipsis>
            </div>
          )}
        </div>
        {this.state.liveUpdates ?
          <div style={{ display: "flex", alignItems: "center", flexDirection: "row", justifyContent: "flex-end" }}><h4>Live Scoreboard </h4> <Ripple color="#a61d24" size={40} /></div> :
          <div style={{ display: "flex", alignItems: "center", flexDirection: "row", justifyContent: "flex-end" }}><h4>Connecting Live Scoreboard </h4> <Ellipsis color="#177ddc" size={40} /></div>
        }
        {!this.state.loadingTable && (
          <div style={{ height: "70%", width: "100%", minWidth: "70vw" }}>
            <Table style={{ marginTop: "2vh" }} dataSource={this.state.scores} pagination={{ pageSize: 20 }} locale={{
              emptyText: (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "10vh" }}>
                  <FileUnknownTwoTone style={{ color: "#177ddc", fontSize: "400%", zIndex: 1 }} />
                  <h1 style={{ fontSize: "200%" }}>That's odd. There are no users created yet.</h1>
                </div>
              )
            }}>
              <Column title="Position" dataIndex="position" key="position" />
              <Column title="Username" dataIndex="username" key="username"
                render={(text, row, index) => {
                  return <Link to={"/Profile/" + text}><a style={{ fontSize: "110%", fontWeight: 700 }}><Avatar src={"https://api.irscybersec.tk/uploads/profile/" + text + ".webp"} style={{ marginRight: "1ch" }} /><span>{text}</span></a></Link>;
                }}
              />
              <Column title="Score" dataIndex="score" key="score" />
              <Column title="Last Solve" dataIndex="time" key="time" />
            </Table>
          </div>
        )}
      </Layout>
    );
  }
}

export default Scoreboard;
