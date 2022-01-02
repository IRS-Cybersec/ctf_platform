import React from 'react';
import { Layout, Card, List, Progress, message, Button, Select } from 'antd';
import {
  FileUnknownTwoTone,
  LeftCircleOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import ChallengesTagSort from "./challengesTagSort.js";
import { Ellipsis } from 'react-spinners-css';
import { Transition, animated } from 'react-spring';

const { Meta } = Card;
const { Option } = Select;

class Challenges extends React.Component {
  constructor(props) {
    super(props);
    this.child = React.createRef();
    this.tagSortRef = React.createRef();

    this.state = {
      categories: [],
      currentCategory: false,
      originalData: [],
      tagData: [],
      loadingChall: false,
      currentCategoryChallenges: [],
      foundChallenge: false,
      countDownTimerStrings: {},
      userCategories: {},
      disableNonCatFB: false
    };
  }

  componentDidMount() {
    this.setState({ loadingChall: true })

    this.fetchCategories()
  }

  parseCategories(data, usernameTeamCache) {
    //iterate through categories
    let countDownTimerStrings = {}
    let challengeMetaInfo = []
    for (let x = 0; x < data.length; x++) {
      let currentCategory = data[x].challenges
      let solvedStats = {
        challenges: currentCategory.length,
        solved: 0,
        percentage: 0
      }

      //iterate through each category's challenges
      for (let y = 0; y < currentCategory.length; y++) {
        // Iterate through the solve list of each challenge
        currentCategory[y].solved = false
        for (let i = 0; i < currentCategory[y].solves.length; i++) {
          if (currentCategory[y].solves[i] in usernameTeamCache && usernameTeamCache[currentCategory[y].solves[i]] === this.props.team) {
            solvedStats.solved += 1
            currentCategory[y].solved = true
            break
          }
          else if (currentCategory[y].solves[i] === this.props.username) {
            solvedStats.solved += 1
            currentCategory[y].solved = true
            break
          }
        }
      }

      solvedStats.percentage = Math.round((solvedStats.solved / solvedStats.challenges) * 100)
      challengeMetaInfo.push({ challenges: solvedStats, _id: data[x]._id, meta: data[x].meta })
      if ("time" in data[x].meta) {
        const startTime = new Date(data[x].meta.time[0])
        const endTime = new Date(data[x].meta.time[1])
        const currentTime = new Date()
        // Competition hasn't started
        if (currentTime < startTime) {
          const timeLeft = Math.ceil((startTime - currentTime) / 1000)
          countDownTimerStrings[data[x]._id] = this.getTimerString(timeLeft, true)
        }
        else {
          const timeLeft = Math.ceil((endTime - currentTime) / 1000)
          countDownTimerStrings[data[x]._id] = this.getTimerString(timeLeft, false)
        }
      }
    }
    this.setState({ countDownTimerStrings: countDownTimerStrings })
    setInterval(this.countDownTicker.bind(this), 1000 * 15, data)
    return [challengeMetaInfo, data];
  }

  countDownTicker(data) {
    let countDownTimerStrings = {}
    for (let x = 0; x < data.length; x++) {
      if ("time" in data[x].meta) {
        const startTime = new Date(data[x].meta.time[0])
        const endTime = new Date(data[x].meta.time[1])
        const currentTime = new Date()
        // Competition hasn't started
        if (currentTime < startTime) {
          const timeLeft = Math.ceil((startTime - currentTime) / 1000)
          countDownTimerStrings[data[x]._id] = this.getTimerString(timeLeft, true)
        }
        else {
          const timeLeft = Math.ceil((endTime - currentTime) / 1000)
          countDownTimerStrings[data[x]._id] = this.getTimerString(timeLeft, false)
        }
      }
    }
    this.setState({ countDownTimerStrings: countDownTimerStrings })
  }

  getTimerString(timeLeft, tillStart) {

    if (timeLeft > 0) {
      let minutes = Math.ceil(timeLeft / 60)
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

      let finalTime = " till start."
      if (!tillStart) finalTime = " remaining."
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
      return finalTime
    }
    else {
      if (tillStart) return "Competition has started! Refresh this page to see the challenges!"
      else return "The competition has ended"
    }


  }

  fetchCategories = async () => {
    await fetch(window.ipAddress + "/v1/challenge/list", {
      method: 'get',
      headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
    }).then((results) => {
      return results.json(); //return data in JSON (since its JSON data)
    }).then(async (data) => {
      if (data.success === true) {
        const [categoryMetaInfo, originalData] = this.parseCategories(data.challenges, data.usernameTeamCache) //this statement changes the object data

        //convert array to dict

        let originalDataDictionary = {}
        for (let i = 0; i < originalData.length; i++) {
          originalDataDictionary[originalData[i]._id] = originalData[i].challenges
        }
        this.setState({ disableNonCatFB: data.disableNonCatFB, userCategories: data.userCategories, categories: categoryMetaInfo, originalData: originalDataDictionary, loadingChall: false })
        let categoryChall = this.props.match.params.categoryChall;
        const mongoID = /^[a-f\d]{24}$/i
        if (typeof categoryChall !== "undefined") {
          categoryChall = decodeURIComponent(categoryChall)
          if (mongoID.test(categoryChall)) {
            if (typeof categoryChall !== "undefined") {
              const challenge = categoryChall
              let foundChallenge = false
              loop1:
              for (let i = 0; i < originalData.length; i++) {
                for (let x = 0; x < originalData[i].challenges.length; x++) {
                  if (originalData[i].challenges[x]._id === challenge) {
                    foundChallenge = originalData[i].challenges[x]
                    foundChallenge.category = originalData[i]._id
                    break loop1;
                  }
                }
              }
              if (foundChallenge) {
                this.setState({ currentCategory: foundChallenge.category, currentCategoryChallenges: [originalDataDictionary[foundChallenge.category]], foundChallenge: foundChallenge })
              }
              else message.error("Challenge with ID '" + challenge + "' not found.")
            }
          }
          else {
            if (categoryChall in originalDataDictionary) this.setState({ currentCategory: categoryChall, currentCategoryChallenges: [originalDataDictionary[categoryChall]] })
            else message.error("Category '" + categoryChall + "' not found.")

          }
        }

      }
      else {
        message.error({ content: "Oops. Unknown error" })
      }


    }).catch((error) => {
      console.log(error)
      message.error({ content: "Oops. There was an issue connecting with the server" });
    })
    return true
  }

  sortCats(value) {
    this.tagSortRef.current.sortCats(value)
  }

  setStateAsync(state) {
    return new Promise((resolve) => {
      this.setState(state, resolve)
    });
  }

  handleRefresh = async () => {

    await this.fetchCategories()
    await this.setStateAsync({ currentCategoryChallenges: [this.state.originalData[this.state.currentCategory]] })
    await this.props.obtainScore()
    return true
  }

  render() {
    return (
      <Layout className="layout-style">
        <div id="Header" className="challenge-header-style">

          <h1 style={{
            color: "white",
            fontSize: "280%",
            letterSpacing: ".3rem",
            fontWeight: 300,
            marginBottom: "10px"
          }}> CHALLENGES

          </h1>
          {this.state.currentCategory && (<h4 className="category-header">{this.state.currentCategory}</h4>)}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignContent: "center", marginBottom: "10px", textAlign: "center" }}>

          <Button size="large" disabled={!this.state.currentCategory} icon={<LeftCircleOutlined />} style={{ backgroundColor: "#1f1f1f" }} onClick={() => { this.props.history.push("/Challenges"); this.setState({ currentCategory: false, foundChallenge: false }) }} size="large">Back</Button>

          {this.state.currentCategory && this.state.countDownTimerStrings[this.state.currentCategory] && (
            <h1 style={{
              color: "white",
              fontSize: "170%",
              letterSpacing: ".3rem",
              fontWeight: 300,
              color: "#d89614",
            }}>
              {this.state.countDownTimerStrings[this.state.currentCategory]}
            </h1>
          )}
          <div>
            <Select disabled={!this.state.currentCategory} defaultValue="points" style={{ width: "20ch", backgroundColor: "#1f1f1f" }} onChange={this.sortCats.bind(this)}>
              <Option value="points">Sort by ↑Points</Option>
              <Option value="pointsrev">Sort by ↓Points</Option>
              <Option value="abc">Sort A→Z</Option>
              <Option value="abcrev">Sort Z→A</Option>
            </Select>

          </div>
        </div>


        <div>
          <Transition
            items={this.state.loadingChall}
            from={{ opacity: 0 }}
            enter={{ opacity: 1 }}
            leave={{ opacity: 0 }}>
            {(props, toggle) => {
              if (toggle === true) {
                return (<animated.div style={{ ...props, position: "absolute", left: "55%", transform: "translate(-55%, 0%)", zIndex: 10 }}>
                  <Ellipsis color="#177ddc" size={120} ></Ellipsis>
                </animated.div>)
              }
              else {
                return (<animated.div style={{ ...props }}>
                  {!this.state.currentCategory && (
                    <List
                      grid={{
                        xs: 1,
                        sm: 2,
                        md: 2,
                        lg: 3,
                        xl: 3,
                        xxl: 4,
                        gutter: 20
                      }}
                      dataSource={this.state.categories}
                      locale={{
                        emptyText: (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "10vh" }}>
                            <FileUnknownTwoTone style={{ color: "#177ddc", fontSize: "400%", zIndex: 1 }} />
                            <h1 style={{ fontSize: "200%" }}>Oops, no challenges have been created.</h1>
                          </div>
                        )
                      }}
                      renderItem={item => {
                        return (
                          <List.Item key={item._id}>
                            <Link to={"/Challenges/" + item._id}>
                              <div onClick={() => {
                                this.setState({ currentCategory: item._id, currentSolvedStatus: item.challenges, currentCategoryChallenges: [this.state.originalData[item._id]] });

                              }}>
                                <Card
                                  hoverable
                                  type="inner"
                                  bordered={true}
                                  className="card-design hover"
                                  cover={<img style={{ overflow: "hidden" }} alt="Category Card" src={"/static/category/" + item._id + ".webp"} />}
                                >
                                  <Meta
                                    title={
                                      <div style={{ display: "flex", flexDirection: "column", textAlign: "center" }}>
                                        <div id="Title" style={{ display: "flex", color: "#f5f5f5", alignItems: "center", marginBottom: "2ch" }}>
                                          <h1 style={{ color: "white", fontSize: "2.5ch", width: "40ch", textOverflow: "ellipsis", overflow: "hidden" }}>{item._id}</h1>
                                          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
                                            <h2 style={{ fontSize: "2.5ch", marginLeft: "1vw", color: "#faad14", fontWeight: 700 }}>{item.challenges.solved}/{item.challenges.challenges}</h2>
                                            <Progress type="circle" percent={item.challenges.percentage} width="7ch" strokeColor={{
                                              '0%': '#177ddc',
                                              '100%': '#49aa19',
                                            }} style={{ marginLeft: "1vw", fontSize: "2ch" }} />
                                          </div>
                                        </div>
                                        <div>
                                          {"time" in item.meta && (
                                            <span style={{
                                              color: "#d89614",
                                              letterSpacing: ".1rem",
                                              fontWeight: 300,
                                              whiteSpace: "initial"
                                            }}>{this.state.countDownTimerStrings[item._id]}</span>
                                          )}
                                          {item.meta.visibility === false && (
                                            <h4 style={{ color: "#d9d9d9" }}>Hidden Category <EyeInvisibleOutlined /></h4>
                                          )}
                                        </div>
                                      </div>
                                    }
                                  />
                                </Card> {/*Pass entire datasource as prop*/}
                              </div>
                            </Link>
                          </ List.Item>
                        )
                      }
                      }
                    />
                  )}

                  {this.state.currentCategory && (
                    <ChallengesTagSort permissions={this.props.permissions} disableNonCatFB={this.state.disableNonCatFB} userCategories={this.state.userCategories} obtainScore={this.props.obtainScore.bind(this)} match={this.props.match} history={this.props.history} foundChallenge={this.state.foundChallenge} currentCategoryChallenges={this.state.currentCategoryChallenges} handleRefresh={this.handleRefresh.bind(this)} ref={this.tagSortRef} category={this.state.currentCategory} currentCategoryChallenges={this.state.currentCategoryChallenges}></ChallengesTagSort>
                  )}
                </animated.div>)
              }
            }
            }
          </Transition>
        </div>
      </Layout>

    );
  }
}

export default Challenges;
