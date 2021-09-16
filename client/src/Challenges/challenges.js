import React from 'react';
import { Layout, Card, List, Progress, message, Button, Select } from 'antd';
import {
  FileUnknownTwoTone,
  LeftCircleOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import ChallengesTagSort from "./challengesTagSort.js";
import { Ellipsis } from 'react-spinners-css';
import { Transition, animated } from 'react-spring';

const { Meta } = Card;
const { Option } = Select;

const categoryImages = [require("./../assets/catPhoto1.webp").default]



var i = -1

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
      foundChallenge: false
    };
  }

  componentDidMount() {
    this.setState({ loadingChall: true })

    this.fetchCategories()
  }

  parseCategories(data) {
    for (let x = 0; x < data.length; x++) {
      let currentCategory = data[x].challenges
      let solvedStats = {
        challenges: currentCategory.length,
        solved: 0,
        percentage: 0
      }

      for (let y = 0; y < currentCategory.length; y++) {
        if (currentCategory[y].solved === true) {
          solvedStats.solved += 1
        }
      }

      solvedStats.percentage = Math.round((solvedStats.solved / solvedStats.challenges) * 100)
      data[x].challenges = solvedStats
    }

    return data;

  }

  fetchCategories = async () => {
    await fetch(window.ipAddress + "/v1/challenge/list", {
      method: 'get',
      headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken},
    }).then((results) => {
      return results.json(); //return data in JSON (since its JSON data)
    }).then(async (data) => {
      if (data.success === true) {

        let originalData = JSON.parse(JSON.stringify(data.challenges))
        const newData = await this.parseCategories(data.challenges) //this statement changes the object data

        //convert array to dict

        let originalDataDictionary = {}
        for (let i = 0; i < originalData.length; i++) {
          originalDataDictionary[originalData[i]._id] = originalData[i].challenges
        }

        this.setState({ categories: newData, originalData: originalDataDictionary, loadingChall: false })
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
              console.log([this.state.originalData[foundChallenge.category]])
              if (foundChallenge) {
                this.setState({ currentCategory: foundChallenge.category, currentCategoryChallenges: [this.state.originalData[foundChallenge.category]], foundChallenge: foundChallenge })
              }
              else message.error("Challenge with ID '" + challenge + "' not found.")
            }
          } 
          else {
            if (categoryChall in this.state.originalData) this.setState({ currentCategory: categoryChall, currentCategoryChallenges: [this.state.originalData[categoryChall]] })
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
        <div style={{ display: "flex", justifyContent: "space-between", alignContent: "center", marginBottom: "10px" }}>

          <Button size="large" disabled={!this.state.currentCategory} icon={<LeftCircleOutlined />} style={{ backgroundColor: "#1f1f1f" }} onClick={() => { this.props.history.push("/Challenges"); this.setState({ currentCategory: false, foundChallenge: false }) }} size="large">Back</Button>
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
                        i = 0

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
                                  bodyStyle={{ backgroundColor: "#262626" }}
                                  className="card-design"
                                  style={{ overflow: "hidden" }}
                                  cover={<img style={{ overflow: "hidden" }} alt="Category Card" src={categoryImages[i]} />}
                                >
                                  <Meta
                                    title={
                                      <div id="Title" style={{ display: "flex", color: "#f5f5f5", flexDirection: "row", alignContent: "center", alignItems: "center" }}>
                                        <h1 style={{ color: "white", fontSize: "2.5ch", width: "40ch", textOverflow: "ellipsis", overflow: "hidden" }}>{item._id}</h1>
                                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
                                          <h2 style={{ fontSize: "2.5ch", marginLeft: "1vw", color: "#faad14", fontWeight: 700 }}>{item.challenges.solved}/{item.challenges.challenges}</h2>
                                          <Progress type="circle" percent={item.challenges.percentage} width="7ch" strokeColor={{
                                            '0%': '#177ddc',
                                            '100%': '#49aa19',
                                          }} style={{ marginLeft: "1vw", fontSize: "2ch" }} />
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
                    <ChallengesTagSort obtainScore={this.props.obtainScore.bind(this)} match={this.props.match} history={this.props.history} foundChallenge={this.state.foundChallenge} currentCategoryChallenges={this.state.currentCategoryChallenges} handleRefresh={this.handleRefresh.bind(this)} ref={this.tagSortRef} category={this.state.currentCategory} currentCategoryChallenges={this.state.currentCategoryChallenges}></ChallengesTagSort>
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
