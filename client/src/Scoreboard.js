import React from 'react';
import { Layout, message, Table } from 'antd';
import {
  LoadingOutlined
} from '@ant-design/icons';
import './App.css';
import { orderBy } from "lodash";
import { AreaChart, Area, Tooltip, XAxis, YAxis, CartesianGrid, Label } from "recharts";

const { Column } = Table;


class Scoreboard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      scores: [],
      graphData: [],
      top10: [""] * 10,
      loadingGraph: false
    };
  }

  componentDidMount() {
    this.getFinalScores()
  }

  getFinalScores() {
    this.setState({loadingGraph: true})
    fetch("https://api.irscybersec.tk/v1/scores", {
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
          scoreArray[i].position = String(i + 1) + "."

          if (i < 10) {
            top10[scoreArray[i].username] = ""
            top10names.push(scoreArray[i].username)
            top10scores[scoreArray[i].username] = scoreArray[i].score
          }

        }
        console.log(scoreArray)
        this.setState({ scores: scoreArray, top10: top10names })
        this.plotGraph(top10, top10scores)
      }
      else {
        message.error({ content: "Oops. Unknown error" })
      }


    }).catch((error) => {
      message.error({ content: "Oops. There was an issue connecting with the server" });
    })
  }

  plotGraph(top10, top10scores) {
    console.log(top10)
    fetch("https://api.irscybersec.tk/v1/scoreboard", {
      method: 'get',
      headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
    }).then((results) => {
      return results.json(); //return data in JSON (since its JSON data)
    }).then((data) => {
      console.log(data)
      let formattedData = []
      let finalPoint = {}

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
              formattedData.push(currentPoint)
            }

          }
        }


        formattedData = orderBy(formattedData, ["Time"], ["asc"])
        console.log(formattedData)

        let pointDict = {}
        let finalData = []

        for (let i = 0; i < formattedData.length; i++) {

          pointDict[formattedData[i].name] = formattedData[i].points
          pointDict["Time"] = new Date(formattedData[i].Time).toLocaleString("en-US", { timeZone: "Asia/Singapore" })

          let copy = Object.assign({}, pointDict)

          finalData.push(copy)
        }

        finalData.push(finalPoint)
        console.log(finalData)

        this.setState({ graphData: finalData, loadingGraph: false })

      }
      else {
        message.error({ content: "Oops. Unknown error" })
      }


    }).catch((error) => {
      message.error({ content: "Oops. There was an issue connecting with the server" });
    })
  }

  render() {
    return (

      <Layout style={{ height: "100%", width: "100%", overflowY: "scroll", overflowX: "auto" }}>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center" }}>

          <AreaChart width={1000} height={350} data={this.state.graphData}
            margin={{ top: 10, right: 30, left: 0, bottom: 15 }}>

            <defs>
              <linearGradient id="color1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#791a1f" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f89f9a" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="color2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c4a15" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f8cf8d" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="color3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c5914" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f8df8b" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="color4" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#536d13" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#e4f88b" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="color5" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#306317" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#b2e58b" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="color6" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#146262" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#84e2d8" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="color7" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#164c7e" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8dcff8" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="color8" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#203175" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#a8c1f8" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="color9" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3e2069" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#cda8f0" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="color10" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#75204f" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f8a8cc" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <XAxis dataKey="Time">
              <Label offset={-4} position="insideBottom" style={{ fill: 'rgba(207, 207, 207, 1)' }}>
                Time
                                </Label>
            </XAxis>
            <YAxis >
              <Label offset={0} position='insideLeft' style={{ fill: 'rgba(207, 207, 207, 1)' }}>
                Score
                                </Label>
            </YAxis>
            <CartesianGrid strokeDasharray="3 3" />

            <Tooltip labelStyle={{ backgroundColor: "#1c2b3e" }} contentStyle={{ backgroundColor: "#1c2b3e" }} wrapperStyle={{ backgroundColor: "#1c2b3e" }} />
            <Area type="monotone" dataKey={this.state.top10[0]} stroke="#d32029" fillOpacity={1} fill="url(#color1)" />
            <Area type="monotone" dataKey={this.state.top10[1]} stroke="#d87a16" fillOpacity={1} fill="url(#color2)" />
            <Area type="monotone" dataKey={this.state.top10[2]} stroke="#d89614" fillOpacity={1} fill="url(#color3)" />
            <Area type="monotone" dataKey={this.state.top10[3]} stroke="#8bbb11" fillOpacity={1} fill="url(#color4)" />
            <Area type="monotone" dataKey={this.state.top10[4]} stroke="#49aa19" fillOpacity={1} fill="url(#color5)" />
            <Area type="monotone" dataKey={this.state.top10[5]} stroke="#13a8a8" fillOpacity={1} fill="url(#color6)" />
            <Area type="monotone" dataKey={this.state.top10[6]} stroke="#177ddc" fillOpacity={1} fill="url(#color7)" />
            <Area type="monotone" dataKey={this.state.top10[7]} stroke="#2b4acb" fillOpacity={1} fill="url(#color8)" />
            <Area type="monotone" dataKey={this.state.top10[8]} stroke="#642ab5" fillOpacity={1} fill="url(#color9)" />
            <Area type="monotone" dataKey={this.state.top10[9]} stroke="#cb2b83" fillOpacity={1} fill="url(#color10)" />
            <Area type="monotone" dataKey="Hi" stroke="#8884d8" fillOpacity={1} fill="url(#colorPv)" />
          </AreaChart>
          {this.state.loadingGraph && (
            <div className="demo-loading-container">
              <LoadingOutlined style={{ color: "#177ddc", fontSize: "3vw" }} />
            </div>
          )}
        </div>
        <Table style={{ marginTop: "2vh" }} dataSource={this.state.scores} pagination={{ pageSize: 30 }} locale={{
          emptyText: (
            <div className="demo-loading-container" style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", fontSize: "3vw" }}>
              <LoadingOutlined style={{ color: "#177ddc" }} />
            </div>
          )
        }}>
          <Column title="Position" dataIndex="position" key="position" />
          <Column title="Username" dataIndex="username" key="username" />
          <Column title="Score" dataIndex="score" key="score" />
        </Table>
      </Layout>
    );
  }
}

export default Scoreboard;
