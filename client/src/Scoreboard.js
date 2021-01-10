import React from 'react';
import { Layout, message, Table } from 'antd';
import {
  FileUnknownTwoTone
} from '@ant-design/icons';
import './App.css';
import { orderBy } from "lodash";
import { AreaChart, Area, Tooltip, XAxis, YAxis, CartesianGrid, Label, ResponsiveContainer } from "recharts";
import { Ellipsis } from 'react-spinners-css';
import { animated } from 'react-spring/renderprops';
import { Link } from 'react-router-dom';

const { Column } = Table;


class Scoreboard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      scores: [],
      graphData: [{ "": 0 }],
      top10: [""] * 10,
      loadingGraph: false,
      loadingTable: false
    };
  }

  componentDidMount() {
    this.getFinalScores()
  }

  getFinalScores() {
    this.setState({ loadingGraph: true, loadingTable: true })
    fetch(window.ipAddress + "/v1/scores", {
      method: 'get',
      headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
    }).then((results) => {
      return results.json(); //return data in JSON (since its JSON data)
    }).then((data) => {
      let top10 = []
      let top10names = []
      let top10scores = {}


      if (data.success === true) {
        let scoreArray = orderBy(data.scores, ["score"], ["desc"])
        for (let i = 0; i < scoreArray.length; i++) {

          if (i < 10) {
            top10[scoreArray[i].username] = ""
            top10names.push(scoreArray[i].username)
            top10scores[scoreArray[i].username] = scoreArray[i].score
          }

        }

        const waitalittle = async () => {
          await this.setState({ top10: top10names })
          this.plotGraph(top10, top10scores, scoreArray)
        }
        waitalittle()

      }
      else {
        message.error({ content: "Oops. Unknown error" })
      }


    }).catch((error) => {
      message.error({ content: "Oops. There was an issue connecting with the server" });
    })
  }

  plotGraph(top10, top10scores, scoreArray) {
    fetch(window.ipAddress + "/v1/scoreboard", {
      method: 'get',
      headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
    }).then((results) => {
      return results.json(); //return data in JSON (since its JSON data)
    }).then((data) => {
      let formattedData = []
      let finalPoint = {}

      let timestamp = {}

      if (data.success === true) {
        finalPoint = top10scores
        finalPoint["Time"] = new Date().toLocaleString("en-US", { timeZone: "Asia/Singapore" })

        for (let i = 0; i < data.users.length; i++) {
          let currentPoint = {}

          if (data.users[i]._id in top10) {
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

          //Process timestamps
          let scores2 = data.users[i].changes
          console.log(scores2)

          for (let x = 0; x < scores2.length; x++) {
            if (data.users[i]._id in timestamp) {

              let d1 = new Date(timestamp[data.users[i]._id])
              let d2 = new Date(scores2[x].timestamp)
              if (d1 < d2 && scores2[x].points > 0) {
                timestamp[data.users[i]._id] = scores2[x].timestamp
              }
            }
            else {
              timestamp[data.users[i]._id] = scores2[x].timestamp
            }
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
        for (let x = 0; x < scoreArray.length; x++) {

          if ("timestamp" in scoreArray[x]) {
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
              finalTime = minutes.toString() + " minutes " + finalTime
            }
            if (hours !== 0) {
              finalTime = hours.toString() + " hours " + finalTime
            }
            if (days !== 0) {
              finalTime = days.toString() + " days " + finalTime
            }
            if (months !== 0) {
              finalTime = months.toString() + " months " + finalTime
            }
            if (years !== 0) {
              finalTime = years.toString() + " years " + finalTime
            }
            scoreArray[x].timestamp = finalTime
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
        //console.log(finalData)
        //Temp fix for table data to use timestamp
        this.setState({ graphData: finalData, loadingGraph: false, scores: scoreArray, loadingTable: false })

      }
      else {
        message.error({ content: "Oops. Unknown error" })
      }


    }).catch((error) => {
      console.log(error)
      message.error({ content: "Oops. There was an issue connecting with the server" });
    })
  }

  render() {
    return (

      <animated.div style={{ ...this.props.transition, height: "95vh", overflowY: "auto", backgroundColor: "rgba(0, 0, 0, 0.7)", border: "5px solid transparent", borderRadius: "20px" }}>
        <Layout style={{ margin: "20px", backgroundColor: "rgba(0, 0, 0, 0)", display: "flex", flexDirection: "column", alignItems: "center", justifyItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "5ch" }}>Scoreboard</h1>
          </div>
          <div style={{ height: 375, width: "100%", backgroundColor: "rgba(0, 0, 0, 0.3)", border: "5px solid transparent", borderRadius: "20px", padding: "10px", margin: "10px" }}>
            <ResponsiveContainer width="90%" height={350}>
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
              <div className="demo-loading-container">
                <Ellipsis size={40} color="#177ddc" />
              </div>
            )}
          </div>
          {!this.state.loadingTable && (
            <div style={{ height: "70%", width: "100%", minWidth: "70vw" }}>
              <Table style={{ marginTop: "2vh" }} dataSource={this.state.scores} pagination={{ pageSize: 20 }} locale={{
                emptyText: (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "10vh" }}>
                    <FileUnknownTwoTone style={{ color: "#177ddc", fontSize: "400%", zIndex: 1 }} />
                    <h1 style={{ fontSize: "200%" }}>That's odd. There are no users</h1>
                  </div>
                )
              }}>
                <Column title="Position" dataIndex="position" key="position" />
                <Column title="Username" dataIndex="username" key="username"
                  render={(text, row, index) => {
                    return <Link to={"/Profile/" + text}><a style={{ fontSize: "110%", fontWeight: 700 }}>{text}</a></Link>;
                  }}
                />
                <Column title="Score" dataIndex="score" key="score" />
                <Column title="Last Solve" dataIndex="timestamp" key="timestamp" />
              </Table>
            </div>
          )}
        </Layout>
      </animated.div >
    );
  }
}

export default Scoreboard;
