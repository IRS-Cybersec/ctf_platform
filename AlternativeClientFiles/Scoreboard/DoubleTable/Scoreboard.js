import React from 'react';
import { Layout, message, Table, Avatar, Select, notification } from 'antd';
import {
  FileUnknownTwoTone,
  TeamOutlined,
  ApartmentOutlined
} from '@ant-design/icons';
import orderBy from 'lodash.orderby'
import { Ellipsis, Ripple } from 'react-spinners-css';
import { Link } from 'react-router-dom';

const { Column } = Table;
const { Option } = Select;

var changes = {}
var updating = false
var userCategories = {}
var userCategory = ""
var userCategory2 = ""

class Scoreboard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      scores: [],
      loadingTable: false,
      liveUpdates: false,
      categoryListOptions: [],
      scoreTransactions: []
    };
  }

  componentDidMount = async () => {
    let scoreboardData = window.scoreboardData
    if (typeof scoreboardData === "undefined") {
      changes = await this.getChanges()
      window.scoreboardData = changes
    }
    else {
      userCategories = window.userCategories
      changes = scoreboardData
    }
    userCategory = "none"
    userCategory2 = "none"

    // Render whatever data we have either: stored in global window/retrieved from Fetch for fast loading of scoreboard
    this.sortPlotRenderData(JSON.parse(JSON.stringify(changes)))
    this.sortPlotRenderData(JSON.parse(JSON.stringify(changes)), true)
    this.scoreHistoryRenderData(JSON.parse(JSON.stringify(changes)))
    let categoryListOptions = []
    for (let i = 0; i < window.categoryList.length; i++) {
      categoryListOptions.push(
        <Option value={window.categoryList[i]}>{window.categoryList[i]}</Option>
      )
    }
    categoryListOptions.unshift(<Option value="none">All Players</Option>)
    this.setState({ categoryListOptions: categoryListOptions })

    this.connectWebSocket() //Connect to socket server for live scoreboard and this will update the scoreboard with the latest data

    //Update last solved timing
    setInterval(() => { this.lastSolveTiming() }, 60 * 1000)

  }

  lastSolveTiming() {
    if (!updating) {
      let scoreArray = this.state.scores
      let scoreTransactions = this.state.scoreTransactions
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
          scoreArray[x].time = "No solves yet"
        }
      }

      for (let x = 0; x < scoreTransactions.length; x++) {
        const dateTime = Math.abs(new Date() - new Date(scoreTransactions[x].timestamp)) / 1000 //no. of seconds since the challenge was completed/hint bought
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
        scoreTransactions[x].time = finalTime
      }
      this.setState({ scores: scoreArray, scoreTransactions: scoreTransactions })
    }
  }

  connectWebSocket() {
    const proto = window.location.protocol === "http:" ? "ws:" : "wss:"
    const address = process.env.NODE_ENV === "development" ? "ws://localhost:20001/" : proto + "//" + window.location.host + "/api/"
    let webSocket = new WebSocket(address)
    webSocket.onmessage = (e) => {
      let data = JSON.parse(e.data)
      if (data.type === "score") {
        updating = true
        const payloadArray = data.data // List of transactions to update
        for (let y = 0; y < payloadArray.length; y++) {
          let userFound = false
          const payload = payloadArray[y] // Current transaction to update

          userLoop:
          for (let x = 0; x < changes.users.length; x++) { // Iterate through user list

            if (changes.users[x]._id === payload.author) { // User found
              userFound = true
              const currentUserChanges = changes.users[x].changes
              let transactionFound = false
              for (let i = 0; i < currentUserChanges.length; i++) { // Iterate through changes (transactions of user)
                if (currentUserChanges[i]._id === payload._id) {
                  transactionFound = true
                  currentUserChanges[i] = payload // If transaction found, update transaction with the new payload
                  break userLoop;
                }
              }
              if (!transactionFound) changes.users[x].changes.push({ author: payload.author, points: payload.points, timestamp: payload.timestamp, _id: payload._id })
              break
            }
          }

          if (!userFound) {
            // User is a new user not on the scoreboard for whatever reason
            changes.users.push({ _id: payload.author, changes: [{ author: payload.author, points: payload.points, timestamp: payload.timestamp, _id: payload._id }] })
          }
        }


        window.scoreboardData = changes
        window.lastChallengeID = payloadArray[0].lastChallengeID
        this.sortPlotRenderData(JSON.parse(JSON.stringify(changes)))
        this.sortPlotRenderData(JSON.parse(JSON.stringify(changes)), true)
        this.scoreHistoryRenderData(JSON.parse(JSON.stringify(changes)))
      }
      else if (data.type === "user-category-update") {
        window.latestUserCategoryUpdateID = data.latestUserCategoryUpdateID
        window.userCategories = data.userCategories
        userCategories = data.userCategories
        this.sortPlotRenderData(JSON.parse(JSON.stringify(window.scoreboardData)))
        this.sortPlotRenderData(JSON.parse(JSON.stringify(window.scoreboardData)), true)
        this.scoreHistoryRenderData(JSON.parse(JSON.stringify(window.scoreboardData)))
      }
      else if (data.type === "team-update") {
        window.teamUpdateID = data.teamUpdateID
        window.scoreboardData = data.data
        this.sortPlotRenderData(JSON.parse(JSON.stringify(data.data)))
        this.sortPlotRenderData(JSON.parse(JSON.stringify(data.data)), true)
        this.scoreHistoryRenderData(JSON.parse(JSON.stringify(data.data)))
      }
      else if (data.type === "init") {
        if (data.data === "bad-auth") message.error("Error connecting to live updates")
        else if (data.data === "missing-auth") message.error("Error connecting to live updates")
        else if (data.data === "up-to-date") this.setState({ liveUpdates: true })

        else if (data.data === "max-connections") {
          message.warn("Your account has more than the concurrent number of socket connections allowed. Disconnecting...")
        }
        else {

          if (data.msg === "team-update") {
            window.teamUpdateID = data.teamUpdateID
            window.scoreboardData = data.data
            this.sortPlotRenderData(JSON.parse(JSON.stringify(data.data)))
            this.sortPlotRenderData(JSON.parse(JSON.stringify(data.data)), true)
            this.scoreHistoryRenderData(JSON.parse(JSON.stringify(data.data)))
          }
          else if (data.msg === "user-category-update") {
            window.latestUserCategoryUpdateID = data.latestUserCategoryUpdateID
            window.userCategories = data.userCategories
            userCategories = data.userCategories
            this.sortPlotRenderData(JSON.parse(JSON.stringify(window.scoreboardData)))
            this.sortPlotRenderData(JSON.parse(JSON.stringify(window.scoreboardData)), true)
            this.scoreHistoryRenderData(JSON.parse(JSON.stringify(window.scoreboardData)))
          }
          else {
            lastChallengeID = parseInt(data.data.lastChallengeID)
            const payloadArray = data.data // List of transactions to update
            for (let y = 0; y < payloadArray.length; y++) {
              let userFound = false
              const payload = payloadArray[y] // Current transaction to update
              userLoop:
              for (let x = 0; x < changes.users.length; x++) { // Iterate through user list

                if (changes.users[x]._id === payload.author) { // User found
                  userFound = true
                  const currentUserChanges = changes.users[x].changes
                  let transactionFound = false
                  for (let i = 0; i < currentUserChanges.length; i++) { // Iterate through changes (transactions of user)
                    if (currentUserChanges[i]._id === payload._id) {
                      transactionFound = true
                      currentUserChanges[i] = payload // If transaction found, update transaction with the new payload
                      break userLoop;
                    }
                  }
                  if (!transactionFound) changes.users[x].changes.push({ author: payload.author, points: payload.points, timestamp: payload.timestamp, _id: payload._id })
                  break
                }
              }

              if (!userFound) {
                // User is a new user not on the scoreboard for whatever reason
                changes.users.push({ _id: payload.author, changes: [{ author: payload.author, points: payload.points, timestamp: payload.timestamp, _id: payload._id }] })
              }
            }


            window.scoreboardData = changes
            window.lastChallengeID = data.lastChallengeID
            this.sortPlotRenderData(JSON.parse(JSON.stringify(changes)))
            this.sortPlotRenderData(JSON.parse(JSON.stringify(changes)), true)
            this.scoreHistoryRenderData(JSON.parse(JSON.stringify(changes)))
            this.setState({ liveUpdates: true })
          }

        }
      }
    }
    webSocket.onopen = (e) => {
      webSocket.send(JSON.stringify({ type: "init", data: { auth: window.IRSCTFToken, lastChallengeID: window.lastChallengeID, teamUpdateID: window.teamUpdateID, latestUserCategoryUpdateID: window.latestUserCategoryUpdateID } }))
      this.props.handleWebSocket(webSocket)
    }
    webSocket.onerror = (e) => {
      console.error(e)
    }
    webSocket.onclose = (e) => {

      this.setState({ liveUpdates: false })
      if (e.code !== 1000) {
        console.log('Socket closed. Attempting to reconnect in 5 seconds', e.reason);
        setTimeout(() => { this.connectWebSocket() }, 5000)
      }
    };
  }

  scoreHistoryRenderData(data) {
    let scoreTransactions = []
    //Process timestamps - find the last solve timing and create scoreArray
    for (let i = 0; i < data.users.length; i++) {
      let scores2 = data.users[i].changes

      for (let x = 0; x < scores2.length; x++) {
        if (scores2[x].points > 0) {
          const index = scoreTransactions.push(scores2[x])
          scoreTransactions[index - 1].isTeam = data.users[i].isTeam
          scoreTransactions[index - 1].members = data.users[i].members
        }
      }
    }


    scoreTransactions = orderBy(scoreTransactions, ["timestamp"], ["desc"])

    for (let x = 0; x < scoreTransactions.length; x++) {
      const dateTime = Math.abs(new Date() - new Date(scoreTransactions[x].timestamp)) / 1000 //no. of seconds since the challenge was completed/hint bought
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
      scoreTransactions[x].time = finalTime
    }

    this.setState({ scoreTransactions: scoreTransactions })
  }

  sortPlotRenderData(data, table2update = false) {
    let scoreArray = []
    let tempScoreTimeStampDict = {}
    const newUserCat = table2update ? userCategory2 : userCategory

    if (newUserCat !== "none") {
      const newUserData = []

      for (let i = 0; i < data.users.length; i++) {
        if (data.users[i]._id in userCategories) {
          if (userCategories[data.users[i]._id] === newUserCat) newUserData.push(data.users[i])
        }
        else if (data.users[i].isTeam) {
          let allUsersRightCat = true
          for (let x = 0; x < data.users[i].members.length; x++) {
            if (userCategories[data.users[i].members[x]] !== newUserCat) {
              allUsersRightCat = false
              break
            }
          }
          if (allUsersRightCat) newUserData.push(data.users[i])
        }

      }
      data.users = newUserData
    }

    //Process timestamps - find the last solve timing and create scoreArray
    for (let i = 0; i < data.users.length; i++) {
      let scores2 = data.users[i].changes

      // some users might have empty "changes" as they have yet to solve anything
      // so we have to include their username first into the dictionary
      tempScoreTimeStampDict[data.users[i]._id] = { timestamp: "0", points: 0 }
      for (let x = 0; x < scores2.length; x++) {
        if (tempScoreTimeStampDict[data.users[i]._id].timestamp !== "0") {
          let d1 = new Date(tempScoreTimeStampDict[data.users[i]._id].timestamp)
          let d2 = new Date(scores2[x].timestamp)

          if (d1 < d2 && scores2[x].points > 0) tempScoreTimeStampDict[data.users[i]._id].timestamp = scores2[x].timestamp
          tempScoreTimeStampDict[data.users[i]._id].points += scores2[x].points

        }
        else {
          if (scores2[x].points === 0) tempScoreTimeStampDict[data.users[i]._id] = { timestamp: "0", points: scores2[x].points, isTeam: data.users[i].isTeam, members: data.users[i].members }
          else tempScoreTimeStampDict[data.users[i]._id] = { timestamp: scores2[x].timestamp, points: scores2[x].points, isTeam: data.users[i].isTeam, members: data.users[i].members }
        }
      }
    }


    //console.log(timestamp)
    // More processing & sort by timestamp
    for (const username in tempScoreTimeStampDict) {
      scoreArray.push({ username: username, timestamp: tempScoreTimeStampDict[username].timestamp, score: tempScoreTimeStampDict[username].points, isTeam: tempScoreTimeStampDict[username].isTeam, members: tempScoreTimeStampDict[username].members })
    }
    scoreArray = orderBy(scoreArray, ["score", "timestamp"], ["desc", "asc"])


    // Fill position + solve time ago
    for (let x = 0; x < scoreArray.length; x++) {

      scoreArray[x].position = String(x + 1) + "."
      if ("timestamp" in scoreArray[x] && scoreArray[x].timestamp !== "0") {
        //console.log(scoreArray[x])

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
        scoreArray[x].time = "No solves yet"
      }
    }
    if (table2update) this.setState({ scores2: scoreArray, loadingTable2: false })
    else this.setState({ scores: scoreArray, loadingTable: false })
    updating = false
  }

  getFinalScores = async () => {
    this.setState({ loadingTable: true })
    const finalData = await fetch(window.ipAddress + "/v1/scores", {
      method: 'get',
      headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
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
      headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
    }).then((results) => {
      return results.json(); //return data in JSON (since its JSON data)
    }).then((data) => {
      if (data.success === true) {
        window.lastChallengeID = data.lastChallengeID
        window.teamUpdateID = data.teamUpdateID
        window.latestUserCategoryUpdateID = data.latestUserCategoryUpdateID
        window.userCategories = data.userCategories
        window.categoryList = data.categoryList

        userCategories = data.userCategories

        return { users: data.users }
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

  handleCategoryChange = (value) => {
    userCategory = value
    this.setState({ loadingTable: true })
    this.sortPlotRenderData(JSON.parse(JSON.stringify(window.scoreboardData)))
  }

  handleCategoryChange2 = (value) => {
    userCategory2 = value
    this.setState({ loadingTable2: true })
    this.sortPlotRenderData(JSON.parse(JSON.stringify(window.scoreboardData)), true)
  }






  render() {
    return (
      <Layout className="layout-style">

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: "150%" }}>Scoring History</h1>
          </div>
          {this.state.liveUpdates ?
            <div style={{ display: "flex", alignItems: "center", flexDirection: "row", justifyContent: "flex-end" }}><h4>Live Scoreboard </h4> <Ripple color="#a61d24" size={40} /></div> :
            <div style={{ display: "flex", alignItems: "center", flexDirection: "row", justifyContent: "flex-end" }}><h4>Connecting Live Scoreboard </h4> <Ellipsis color="#177ddc" size={40} /></div>
          }
        </div>

        <div>
          {!this.state.loadingTable && (
            <Table style={{ marginTop: "2vh" }} dataSource={this.state.scoreTransactions} pagination={{ pageSize: 7 }} locale={{
              emptyText: (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "10vh" }}>
                  <FileUnknownTwoTone style={{ color: "#177ddc", fontSize: "400%", zIndex: 1 }} />
                  <h1 style={{ fontSize: "200%" }}>There are no solves yet. You could be the first!</h1>
                </div>
              )

            }}>
              <Column title="Username" dataIndex="author" key="author"
                render={(text, row, index) => {
                  if (row.isTeam) {
                    return (
                      <Link to={"/Team/" + text}><a style={{ fontSize: "110%", fontWeight: 700, display: "flex", alignItems: "center" }}>
                        <Avatar.Group
                          maxCount={3}
                          maxStyle={{ marginRight: "1ch" }}
                        >
                          {row.members.map((member) => {
                            return (<Avatar src={"/static/profile/" + member + ".webp"} style={{ marginRight: "1ch" }} />)
                          })}
                        </Avatar.Group>
                        <span>{text} <TeamOutlined /></span>
                      </a>
                      </Link>);
                  }
                  else {
                    return <Link to={"/Profile/" + text}><a style={{ fontSize: "110%", fontWeight: 700 }}><Avatar src={"/static/profile/" + text + ".webp"} style={{ marginRight: "1ch" }} /><span>{text}</span></a></Link>;
                  }
                }}
              />
              <Column title="Score" dataIndex="points" key="points" />
              <Column title="Timestamp" dataIndex="time" key="time" />
            </Table>
          )}
        </div>



        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignContent: "center" }}>
            <h1><ApartmentOutlined /> Category: </h1>
            <Select loading={this.state.loadingTable} defaultValue="none" style={{ width: "20ch", backgroundColor: "#1f1f1f", marginLeft: "1ch" }} onChange={(value) => { this.handleCategoryChange(value) }}>
              {this.state.categoryListOptions}
            </Select>
          </div>
          <div style={{ display: "flex", alignContent: "center" }}>
            <h1><ApartmentOutlined /> Category: </h1>
            <Select loading={this.state.loadingTable} defaultValue="none" style={{ width: "20ch", backgroundColor: "#1f1f1f", marginLeft: "1ch" }} onChange={(value) => { this.handleCategoryChange2(value) }}>
              {this.state.categoryListOptions}
            </Select>
          </div>
        </div>


        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ height: "70%", width: "48%", minWidth: "35vw" }}>
            {!this.state.loadingTable && (
              <Table style={{ marginTop: "2vh" }} dataSource={this.state.scores} pagination={{ pageSize: 20 }} locale={{
                emptyText: (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "10vh" }}>
                    <FileUnknownTwoTone style={{ color: "#177ddc", fontSize: "400%", zIndex: 1 }} />
                    <h1 style={{ fontSize: "200%" }}>There are no users created/There are no users in this category</h1>
                  </div>
                )

              }}>
                <Column title="Position" dataIndex="position" key="position" />
                <Column title="Username" dataIndex="username" key="username"
                  render={(text, row, index) => {
                    if (row.isTeam) {
                      return (
                        <Link to={"/Team/" + text}><a style={{ fontSize: "110%", fontWeight: 700, display: "flex", alignItems: "center" }}>
                          <Avatar.Group
                            maxCount={3}
                            maxStyle={{ marginRight: "1ch" }}
                          >
                            {row.members.map((member) => {
                              return (<Avatar src={"/static/profile/" + member + ".webp"} style={{ marginRight: "1ch" }} />)
                            })}
                          </Avatar.Group>
                          <span>{text} <TeamOutlined /></span>
                        </a>
                        </Link>);
                    }
                    else {
                      return <Link to={"/Profile/" + text}><a style={{ fontSize: "110%", fontWeight: 700 }}><Avatar src={"/static/profile/" + text + ".webp"} style={{ marginRight: "1ch" }} /><span>{text}</span></a></Link>;
                    }
                  }}
                />
                <Column title="Score" dataIndex="score" key="score" />
                <Column title="Last Solve" dataIndex="time" key="time" />
              </Table>
            )}
          </div>

          <div style={{ height: "70%", width: "48%", minWidth: "35vw" }}>
            {!this.state.loadingTable2 && (
              <Table style={{ marginTop: "2vh" }} dataSource={this.state.scores2} pagination={{ pageSize: 20 }} locale={{
                emptyText: (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "10vh" }}>
                    <FileUnknownTwoTone style={{ color: "#177ddc", fontSize: "400%", zIndex: 1 }} />
                    <h1 style={{ fontSize: "200%" }}>There are no users created/There are no users in this category</h1>
                  </div>
                )
              }}>
                <Column title="Position" dataIndex="position" key="position" />
                <Column title="Username" dataIndex="username" key="username"
                  render={(text, row, index) => {
                    if (row.isTeam) {
                      return (
                        <Link to={"/Team/" + text}><a style={{ fontSize: "110%", fontWeight: 700, display: "flex", alignItems: "center" }}>
                          <Avatar.Group
                            maxCount={3}
                            maxStyle={{ marginRight: "1ch" }}
                          >
                            {row.members.map((member) => {
                              return (<Avatar src={"/static/profile/" + member + ".webp"} style={{ marginRight: "1ch" }} />)
                            })}
                          </Avatar.Group>
                          <span>{text} <TeamOutlined /></span>
                        </a>
                        </Link>);
                    }
                    else {
                      return <Link to={"/Profile/" + text}><a style={{ fontSize: "110%", fontWeight: 700 }}><Avatar src={"/static/profile/" + text + ".webp"} style={{ marginRight: "1ch" }} /><span>{text}</span></a></Link>;
                    }
                  }}
                />
                <Column title="Score" dataIndex="score" key="score" />
                <Column title="Last Solve" dataIndex="time" key="time" />
              </Table>
            )}
          </div>
        </div>
      </Layout>
    );
  }
}

export default Scoreboard;
